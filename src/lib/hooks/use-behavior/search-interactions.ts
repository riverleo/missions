import type { BehaviorTargetId, CharacterId, Interaction, InteractionId } from '$lib/types';
import { useBehavior, useFulfillment, useInteraction } from '$lib/hooks';

/**
 * BehaviorTarget 기반 인터렉션 검색 (once/fulfill 자동 판단)
 *
 * 원래 search-entity-sources의 getInteractions 로직을 분리한 함수입니다.
 *
 * @param behaviorTargetId - 행동 타겟 ID
 * @param characterId - 캐릭터 ID (캐릭터 제약 필터링용, 선택적)
 * @returns 필터링된 인터렉션 배열
 */
export function searchInteractions(
	behaviorTargetId: BehaviorTargetId,
	characterId?: CharacterId
): Interaction[] {
	const { getBehaviorAction } = useBehavior();
	const { getInteraction } = useInteraction();

	// 1. BehaviorAction 가져오기
	const behaviorAction = getBehaviorAction(behaviorTargetId);

	// 2. idle 타입은 fulfillment가 없음
	if (behaviorAction.type === 'idle') return [];

	// 4. Fulfillment 가져오기 (need_id/condition_id로 자동 탐색)
	const { getAllFulfillmentsByBehaviorAction } = useFulfillment();
	const fulfillments = getAllFulfillmentsByBehaviorAction(behaviorAction);

	// 4. Fulfillment의 Interaction 가져오기 (actionType에 맞는 interaction_type만)
	const interactions: Interaction[] = [];

	for (const fulfillment of fulfillments) {
		// fulfillment_type으로 어떤 interaction_id를 사용할지 결정
		let interactionId: string | null = null;
		if (fulfillment.fulfillment_type === 'building') {
			interactionId = fulfillment.building_interaction_id;
		} else if (fulfillment.fulfillment_type === 'item') {
			interactionId = fulfillment.item_interaction_id;
		} else if (fulfillment.fulfillment_type === 'character') {
			interactionId = fulfillment.character_interaction_id;
		}

		if (interactionId) {
			const interaction = getInteraction(interactionId);
			if (interaction && interaction.type === behaviorAction.type) {
				// 캐릭터 제약 필터링: character_id가 있으면 일치하는 것만
				if (characterId && interaction.character_id && interaction.character_id !== characterId) {
					continue;
				}

				interactions.push(interaction);
			}
		}
	}

	return interactions;
}

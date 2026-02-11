import type { BehaviorTargetId, CharacterId, Interaction, InteractionId } from '$lib/types';
import { useBehavior, useFulfillment, useInteraction } from '$lib/hooks';

/**
 * 행동 타겟 ID를 기반으로 실행 가능한 인터렉션 목록을 반환합니다.
 *
 * 주요 동작:
 * 1. BehaviorAction의 타입(need/condition)에 따라 해당 Fulfillment들을 조회
 * 2. Fulfillment를 회복량(increase_per_tick) 순으로 정렬 (높은 순)
 * 3. 각 Fulfillment에서 타입별 Interaction을 가져옴
 * 4. BehaviorAction.type과 Interaction.type이 일치하는 것만 필터링
 * 5. characterId가 제공된 경우 Interaction.character_id와 일치하는 것만 필터링
 *
 * @param behaviorTargetId - 행동 타겟 ID (BehaviorAction 식별자)
 * @param characterId - 캐릭터 ID (캐릭터 제약 필터링용, 선택적)
 * @returns 회복량이 높은 순으로 정렬된 인터렉션 배열
 */
export function getAllInteractionsByBehaviorTargetId(
	behaviorTargetId: BehaviorTargetId,
	characterId?: CharacterId
): Interaction[] {
	const { getBehaviorAction } = useBehavior();
	const { getInteraction } = useInteraction();

	// 1. BehaviorAction 가져오기
	const behaviorAction = getBehaviorAction(behaviorTargetId);

	// 2. idle 타입은 fulfillment가 없음
	if (behaviorAction.type === 'idle') return [];

	// 3. Fulfillment 가져오기 (need_id/condition_id로 자동 탐색)
	const { getAllFulfillmentsByBehaviorAction } = useFulfillment();
	const fulfillments = getAllFulfillmentsByBehaviorAction(behaviorAction);

	// 회복량이 높은 순으로 정렬 (interactions[0]이 가장 회복량이 높은 인터렉션)
	fulfillments.sort((a, b) => b.increase_per_tick - a.increase_per_tick);

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

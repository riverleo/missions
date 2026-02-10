import type { BehaviorTargetId, CharacterId, Interaction, Fulfillment } from '$lib/types';
import { useBehavior, useBuilding, useCharacter, useInteraction } from '$lib/hooks';
import { FulfillmentIdUtils } from '$lib/utils/fulfillment-id';

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
	if (!behaviorAction) return [];

	// 2. actionType 결정
	const actionType = behaviorAction.type === 'once' ? 'once' : 'fulfill';

	// 3. Fulfillment 가져오기
	let fulfillments: Fulfillment[] = [];

	if ('need_id' in behaviorAction) {
		const { getAllNeedFulfillments, getOrUndefinedNeedFulfillment } = useCharacter();

		if (behaviorAction.need_fulfillment_id) {
			// 명시적 fulfillment
			const fulfillment = getOrUndefinedNeedFulfillment(behaviorAction.need_fulfillment_id);
			if (fulfillment) fulfillments = [FulfillmentIdUtils.to(fulfillment)];
		} else {
			// 자동 탐색: need_id로 필터링
			fulfillments = getAllNeedFulfillments()
				.filter((f) => f.need_id === behaviorAction.need_id)
				.map(FulfillmentIdUtils.to);
		}
	} else {
		const { getOrUndefinedConditionFulfillment, getAllConditionFulfillments } = useBuilding();

		if (behaviorAction.condition_fulfillment_id) {
			// 명시적 fulfillment
			const fulfillment = getOrUndefinedConditionFulfillment(
				behaviorAction.condition_fulfillment_id
			);
			if (fulfillment) fulfillments = [FulfillmentIdUtils.to(fulfillment)];
		} else {
			// 자동 탐색: condition_id로 필터링
			fulfillments = getAllConditionFulfillments()
				.filter((f) => f.condition_id === behaviorAction.condition_id)
				.map(FulfillmentIdUtils.to);
		}
	}

	// 4. Fulfillment의 Interaction 가져오기 (actionType에 맞는 interaction_type만)
	const interactions: Interaction[] = [];

	for (const fulfillment of fulfillments) {
		const interactionId =
			fulfillment.building_interaction_id ||
			fulfillment.item_interaction_id ||
			fulfillment.character_interaction_id;

		if (interactionId) {
			const interaction = getInteraction(interactionId);
			if (interaction && interaction.type === actionType) {
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

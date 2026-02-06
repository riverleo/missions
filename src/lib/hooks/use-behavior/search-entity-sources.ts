import type { BehaviorAction, Fulfillment, Interaction, EntitySource } from '$lib/types';
import { FulfillmentIdUtils } from '$lib/utils/fulfillment-id';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { useBuilding, useCharacter, useInteraction, useItem } from '$lib/hooks';

/**
 * 액션의 타입과 Interaction 참조에 따라 상호작용 가능한 엔티티 템플릿 목록을 반환합니다.
 *
 * - once 타입: once_interaction_type이 있는 Interaction의 엔티티 반환
 * - fulfill 타입: fulfillment의 fulfill_interaction_type이 있는 Interaction의 엔티티 반환
 *
 * @param behaviorAction - 행동 액션 (BehaviorAction)
 * @returns 상호작용 가능한 엔티티 템플릿 배열
 */
export function searchEntitySources(behaviorAction: BehaviorAction): EntitySource[] {
	if (behaviorAction.type === 'once') {
		// once 타입: Interaction 직접 참조
		return searchEntitySourcesForOnce(behaviorAction);
	} else if (behaviorAction.type === 'fulfill') {
		// fulfill 타입: Fulfillment를 통해 Interaction 참조
		return searchEntitySourcesForFulfill(behaviorAction);
	}

	return [];
}

/**
 * once 타입 액션의 상호작용 가능한 엔티티 템플릿을 반환합니다.
 */
function searchEntitySourcesForOnce(behaviorAction: BehaviorAction): EntitySource[] {
	const { getInteraction } = useInteraction();

	const interactions: Interaction[] = [];

	// 1. Interaction 목록 가져오기
	const interactionId =
		behaviorAction.building_interaction_id ||
		behaviorAction.item_interaction_id ||
		behaviorAction.character_interaction_id;

	if (interactionId) {
		// 명시적 interaction
		const interaction = getInteraction(interactionId);
		if (interaction) interactions.push(interaction);
	} else {
		// search: 현재 need/condition의 fulfillment에서 once_interaction_type이 있는 interaction 반환
		const fulfillmentInteractions = getInteractions(behaviorAction, 'once');
		interactions.push(...fulfillmentInteractions);
	}

	// 2. Interaction에서 엔티티 템플릿 추출
	return interactionsToTemplates(interactions);
}

/**
 * BehaviorAction의 need/condition에 연결된 fulfillment의 interaction 목록 반환
 * @param actionType - 'once'면 once_interaction_type이 있는 것만, 'fulfill'이면 fulfill_interaction_type이 있는 것만
 */
function getInteractions(
	behaviorAction: BehaviorAction,
	actionType: 'once' | 'fulfill'
): Interaction[] {
	const { getInteraction } = useInteraction();

	// 1. Fulfillment 가져오기
	let fulfillments: Fulfillment[] = [];

	if ('need_id' in behaviorAction) {
		const { getAllNeedFulfillments, getNeedFulfillment } = useCharacter();

		if (behaviorAction.need_fulfillment_id) {
			// 명시적 fulfillment
			const fulfillment = getNeedFulfillment(behaviorAction.need_fulfillment_id);
			if (fulfillment) fulfillments = [FulfillmentIdUtils.to(fulfillment)];
		} else {
			// 자동 탐색: need_id로 필터링
			fulfillments = getAllNeedFulfillments()
				.filter((f) => f.need_id === behaviorAction.need_id)
				.map(FulfillmentIdUtils.to);
		}
	} else {
		const { getConditionFulfillment, getAllConditionFulfillments } = useBuilding();

		if (behaviorAction.condition_fulfillment_id) {
			// 명시적 fulfillment
			const fulfillment = getConditionFulfillment(behaviorAction.condition_fulfillment_id);
			if (fulfillment) fulfillments = [FulfillmentIdUtils.to(fulfillment)];
		} else {
			// 자동 탐색: condition_id로 필터링
			fulfillments = getAllConditionFulfillments()
				.filter((f) => f.condition_id === behaviorAction.condition_id)
				.map(FulfillmentIdUtils.to);
		}
	}

	// 2. Fulfillment의 Interaction 가져오기 (actionType에 맞는 interaction_type만)
	const interactions: Interaction[] = [];

	for (const fulfillment of fulfillments) {
		const interactionId =
			fulfillment.building_interaction_id ||
			fulfillment.item_interaction_id ||
			fulfillment.character_interaction_id;

		if (interactionId) {
			const interaction = getInteraction(interactionId);
			if (interaction) {
				const hasCorrectType =
					actionType === 'once'
						? interaction.once_interaction_type !== null
						: interaction.fulfill_interaction_type !== null;
				if (hasCorrectType) {
					interactions.push(interaction);
				}
			}
		}
	}

	return interactions;
}

/**
 * fulfill 타입 액션의 상호작용 가능한 엔티티 템플릿을 반환합니다.
 */
function searchEntitySourcesForFulfill(behaviorAction: BehaviorAction): EntitySource[] {
	// 1. Fulfillment에서 fulfill_interaction_type이 있는 interaction 반환
	const interactions = getInteractions(behaviorAction, 'fulfill');

	// 2. Interaction에서 엔티티 템플릿 추출
	return interactionsToTemplates(interactions);
}

/**
 * Interaction 배열을 EntitySource 배열로 변환합니다.
 * 기본 인터랙션(NULL entity_id)의 경우 모든 해당 타입 엔티티를 반환합니다.
 */
function interactionsToTemplates(interactions: Interaction[]): EntitySource[] {
	const { getOrUndefinedBuilding, getAllBuildings } = useBuilding();
	const { getAllItems, getItem } = useItem();
	const { getAllCharacters, getOrUndefinedCharacter } = useCharacter();

	// ID 기준 중복 제거를 위해 Map 사용
	const templateMap = new Map<string, EntitySource>();

	for (const interaction of interactions) {
		if (interaction.interactionType === 'building') {
			// BuildingInteraction
			if (interaction.building_id) {
				// 특정 건물
				const building = getOrUndefinedBuilding(interaction.building_id);
				if (building) {
					const template = EntityIdUtils.source.to(building);
					templateMap.set(building.id, template);
				}
			} else {
				// 기본 인터랙션: 모든 건물
				getAllBuildings().forEach((b) => {
					const template = EntityIdUtils.source.to(b);
					templateMap.set(b.id, template);
				});
			}
		} else if (interaction.interactionType === 'item') {
			// ItemInteraction
			if (interaction.item_id) {
				// 특정 아이템
				const item = getItem(interaction.item_id);
				if (item) {
					const template = EntityIdUtils.source.to(item);
					templateMap.set(item.id, template);
				}
			} else {
				// 기본 인터랙션: 모든 아이템
				getAllItems().forEach((i) => {
					const template = EntityIdUtils.source.to(i);
					templateMap.set(i.id, template);
				});
			}
		} else if (interaction.interactionType === 'character') {
			// CharacterInteraction
			if (interaction.target_character_id) {
				// 특정 캐릭터
				const character = getOrUndefinedCharacter(interaction.target_character_id);
				if (character) {
					const template = EntityIdUtils.source.to(character);
					templateMap.set(character.id, template);
				}
			} else {
				// 기본 인터랙션: 모든 캐릭터
				getAllCharacters().forEach((c) => {
					const template = EntityIdUtils.source.to(c);
					templateMap.set(c.id, template);
				});
			}
		}
	}

	return Array.from(templateMap.values());
}

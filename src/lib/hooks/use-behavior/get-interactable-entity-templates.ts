import type {
	BehaviorAction,
	BuildingInteractionId,
	ItemInteractionId,
	CharacterInteractionId,
	Fulfillment,
	Interaction,
	EntitySource,
	NeedFulfillmentId,
	ConditionFulfillmentId,
	BuildingId,
	ItemId,
	CharacterId,
	NeedBehaviorActionId,
	ConditionBehaviorActionId,
} from '$lib/types';
import { FulfillmentIdUtils } from '$lib/utils/fulfillment-id';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';
import { InteractionIdUtils } from '$lib/utils/interaction-id';
import { useBuilding } from '../use-building';
import { useCharacter } from '../use-character';
import { useItem } from '../use-item';
import { useBehavior } from '../use-behavior';

/**
 * 액션의 타입과 Interaction 참조에 따라 상호작용 가능한 엔티티 템플릿 목록을 반환합니다.
 *
 * - go 타입: 다음 액션에 따라 결정 (interact/fulfill → 해당 대상, idle/없음 → 모든 엔티티)
 * - interact 타입: once_interaction_type이 있는 Interaction의 엔티티 반환
 * - fulfill 타입: fulfillment의 repeat_interaction_type이 있는 Interaction의 엔티티 반환
 *
 * @param behaviorAction - 행동 액션 (BehaviorAction)
 * @returns 상호작용 가능한 엔티티 템플릿 배열
 */
export function getInteractableEntitySources(behaviorAction: BehaviorAction): EntitySource[] {
	if (behaviorAction.type === 'go') {
		// go 타입: search 모드일 때만 대상 반환
		if (behaviorAction.target_selection_method !== 'search') {
			return [];
		}

		// 다음 액션 조회
		const nextAction = getNextBehaviorAction(behaviorAction);
		if (nextAction?.type === 'interact') {
			const nextNextAction = getNextBehaviorAction(nextAction);
			if (nextNextAction?.type === 'fulfill') {
				return getInteractableTemplatesForFulfill(nextNextAction);
			}
			return getInteractableTemplatesForInteract(nextAction);
		} else if (nextAction?.type === 'fulfill') {
			return getInteractableTemplatesForFulfill(nextAction);
		}

		// next가 idle이거나 없으면: 모든 엔티티 반환
		return getAllEntitySources();
	} else if (behaviorAction.type === 'interact') {
		// interact 타입: Interaction 직접 참조
		return getInteractableTemplatesForInteract(behaviorAction);
	} else if (behaviorAction.type === 'fulfill') {
		// fulfill 타입: Fulfillment를 통해 Interaction 참조
		return getInteractableTemplatesForFulfill(behaviorAction);
	}

	return [];
}

/**
 * interact 타입 액션의 상호작용 가능한 엔티티 템플릿을 반환합니다.
 */
function getInteractableTemplatesForInteract(behaviorAction: BehaviorAction): EntitySource[] {
	const { getBuildingInteraction, getAllBuildingInteractions } = useBuilding();
	const { getAllItemInteractions, getItemInteraction } = useItem();
	const { getCharacterInteraction, getAllCharacterInteractions } = useCharacter();

	const interactions: Interaction[] = [];

	// 1. Interaction 목록 가져오기
	if (behaviorAction.building_interaction_id) {
		// 명시적 building interaction
		const interaction = getBuildingInteraction(behaviorAction.building_interaction_id);
		if (interaction) interactions.push(InteractionIdUtils.interaction.to(interaction));
	} else if (behaviorAction.item_interaction_id) {
		// 명시적 item interaction
		const interaction = getItemInteraction(behaviorAction.item_interaction_id);
		if (interaction) interactions.push(InteractionIdUtils.interaction.to(interaction));
	} else if (behaviorAction.character_interaction_id) {
		// 명시적 character interaction
		const interaction = getCharacterInteraction(behaviorAction.character_interaction_id);
		if (interaction) interactions.push(InteractionIdUtils.interaction.to(interaction));
	} else {
		// search: once_interaction_type이 있는 모든 Interactions
		const buildingInteractions = getAllBuildingInteractions()
			.filter((i) => i.once_interaction_type !== null)
			.map(InteractionIdUtils.interaction.to);
		const itemInteractions = getAllItemInteractions()
			.filter((i) => i.once_interaction_type !== null)
			.map(InteractionIdUtils.interaction.to);
		const characterInteractions = getAllCharacterInteractions()
			.filter((i) => i.once_interaction_type !== null)
			.map(InteractionIdUtils.interaction.to);
		interactions.push(...buildingInteractions, ...itemInteractions, ...characterInteractions);
	}

	// 2. Interaction에서 엔티티 템플릿 추출
	return interactionsToTemplates(interactions);
}

/**
 * fulfill 타입 액션의 상호작용 가능한 엔티티 템플릿을 반환합니다.
 */
function getInteractableTemplatesForFulfill(behaviorAction: BehaviorAction): EntitySource[] {
	const { getBuildingInteraction } = useBuilding();
	const { getItemInteraction } = useItem();
	const { getCharacterInteraction } = useCharacter();

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

	// 2. Fulfillment의 Interaction 가져오기 (repeat_interaction_type만)
	const interactions: Interaction[] = [];

	for (const fulfillment of fulfillments) {
		if (fulfillment.building_interaction_id) {
			const interaction = getBuildingInteraction(fulfillment.building_interaction_id);
			if (interaction && interaction.repeat_interaction_type) {
				interactions.push(InteractionIdUtils.interaction.to(interaction));
			}
		} else if (fulfillment.item_interaction_id) {
			const interaction = getItemInteraction(fulfillment.item_interaction_id);
			if (interaction && interaction.repeat_interaction_type) {
				interactions.push(InteractionIdUtils.interaction.to(interaction));
			}
		} else if (fulfillment.character_interaction_id) {
			const interaction = getCharacterInteraction(fulfillment.character_interaction_id);
			if (interaction && interaction.repeat_interaction_type) {
				interactions.push(InteractionIdUtils.interaction.to(interaction));
			}
		}
	}

	// 3. Interaction에서 엔티티 템플릿 추출
	return interactionsToTemplates(interactions);
}

/**
 * Interaction 배열을 EntitySource 배열로 변환합니다.
 * 기본 인터랙션(NULL entity_id)의 경우 모든 해당 타입 엔티티를 반환합니다.
 */
function interactionsToTemplates(interactions: Interaction[]): EntitySource[] {
	const { getBuilding, getAllBuildings } = useBuilding();
	const { getAllItems, getItem } = useItem();
	const { getAllCharacters, getCharacter } = useCharacter();

	// ID 기준 중복 제거를 위해 Map 사용
	const templateMap = new Map<string, EntitySource>();

	for (const interaction of interactions) {
		if (interaction.interactionType === 'building') {
			// BuildingInteraction
			if (interaction.building_id) {
				// 특정 건물
				const building = getBuilding(interaction.building_id);
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
				const character = getCharacter(interaction.target_character_id);
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

/**
 * 다음 액션을 조회합니다.
 */
function getNextBehaviorAction(behaviorAction: BehaviorAction): BehaviorAction | undefined {
	const { getNeedBehaviorAction, getConditionBehaviorAction } = useBehavior();

	if ('need_id' in behaviorAction) {
		if (!behaviorAction.next_need_behavior_action_id) return undefined;
		const nextAction = getNeedBehaviorAction(behaviorAction.next_need_behavior_action_id);
		return nextAction ? BehaviorIdUtils.to(nextAction) : undefined;
	} else {
		if (!behaviorAction.next_condition_behavior_action_id) return undefined;
		const nextAction = getConditionBehaviorAction(behaviorAction.next_condition_behavior_action_id);
		return nextAction ? BehaviorIdUtils.to(nextAction) : undefined;
	}
}

/**
 * 모든 엔티티 템플릿을 반환합니다.
 */
function getAllEntitySources(): EntitySource[] {
	const { getAllBuildings } = useBuilding();
	const { getAllItems } = useItem();
	const { getAllCharacters } = useCharacter();

	const templates: EntitySource[] = [];

	// 모든 건물
	templates.push(...getAllBuildings().map(EntityIdUtils.source.to));

	// 모든 아이템
	templates.push(...getAllItems().map(EntityIdUtils.source.to));

	// 모든 캐릭터
	templates.push(...getAllCharacters().map(EntityIdUtils.source.to));

	return templates;
}

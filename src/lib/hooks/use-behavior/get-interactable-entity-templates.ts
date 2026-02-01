import type {
	NeedBehaviorAction,
	ConditionBehaviorAction,
	Building,
	Character,
	Item,
	Tile,
	BuildingInteraction,
	ItemInteraction,
	CharacterInteraction,
	BuildingInteractionId,
	ItemInteractionId,
	CharacterInteractionId,
	NeedFulfillmentId,
	ConditionFulfillmentId,
	BuildingId,
	ItemId,
	CharacterId,
	NeedBehaviorActionId,
	ConditionBehaviorActionId,
} from '$lib/types';
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
 * @param behaviorAction - 행동 액션 (NeedBehaviorAction 또는 ConditionBehaviorAction)
 * @returns 상호작용 가능한 엔티티 템플릿 배열
 */
export function getInteractableEntityTemplates(
	behaviorAction: NeedBehaviorAction
): (Building | Character | Item | Tile)[];
export function getInteractableEntityTemplates(
	behaviorAction: ConditionBehaviorAction
): (Building | Character | Item | Tile)[];
export function getInteractableEntityTemplates(
	behaviorAction: NeedBehaviorAction | ConditionBehaviorAction
): (Building | Character | Item | Tile)[] {
	if (behaviorAction.type === 'go') {
		// go 타입: search 모드일 때만 대상 반환
		if (behaviorAction.target_selection_method !== 'search') {
			return [];
		}

		// 다음 액션 조회 (type narrowing 사용)
		if ('need_id' in behaviorAction) {
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
		} else {
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
		}

		// next가 idle이거나 없으면: 모든 엔티티 반환
		return getAllEntityTemplates();
	} else if (behaviorAction.type === 'interact') {
		// interact 타입: Interaction 직접 참조
		return getInteractableTemplatesForInteract(behaviorAction);
	} else if (behaviorAction.type === 'fulfill') {
		// fulfill 타입: Fulfillment를 통해 Interaction 참조
		if ('need_id' in behaviorAction) {
			return getInteractableTemplatesForFulfill(behaviorAction);
		} else {
			return getInteractableTemplatesForFulfill(behaviorAction);
		}
	}

	return [];
}

/**
 * interact 타입 액션의 상호작용 가능한 엔티티 템플릿을 반환합니다.
 */
function getInteractableTemplatesForInteract(
	action: NeedBehaviorAction | ConditionBehaviorAction
): (Building | Character | Item | Tile)[] {
	const { getBuildingInteraction, getAllBuildingInteractions } = useBuilding();
	const { getAllItemInteractions, getItemInteraction } = useItem();
	const { getCharacterInteraction, getAllCharacterInteractions } = useCharacter();

	const interactions: (BuildingInteraction | ItemInteraction | CharacterInteraction)[] = [];

	// 1. Interaction 목록 가져오기
	if (action.building_interaction_id) {
		// 명시적 building interaction
		const interaction = getBuildingInteraction(
			action.building_interaction_id as BuildingInteractionId
		);
		if (interaction) interactions.push(interaction);
	} else if (action.item_interaction_id) {
		// 명시적 item interaction
		const interaction = getItemInteraction(action.item_interaction_id as ItemInteractionId);
		if (interaction) interactions.push(interaction);
	} else if (action.character_interaction_id) {
		// 명시적 character interaction
		const interaction = getCharacterInteraction(
			action.character_interaction_id as CharacterInteractionId
		);
		if (interaction) interactions.push(interaction);
	} else {
		// search: once_interaction_type이 있는 모든 Interactions
		const buildingInteractions = getAllBuildingInteractions().filter(
			(i) => i.once_interaction_type !== null
		);
		const itemInteractions = getAllItemInteractions().filter(
			(i) => i.once_interaction_type !== null
		);
		const characterInteractions = getAllCharacterInteractions().filter(
			(i) => i.once_interaction_type !== null
		);
		interactions.push(...buildingInteractions, ...itemInteractions, ...characterInteractions);
	}

	// 2. Interaction에서 엔티티 템플릿 추출
	return interactionsToTemplates(interactions);
}

/**
 * fulfill 타입 액션의 상호작용 가능한 엔티티 템플릿을 반환합니다.
 */
function getInteractableTemplatesForFulfill(
	action: NeedBehaviorAction
): (Building | Character | Item | Tile)[];
function getInteractableTemplatesForFulfill(
	action: ConditionBehaviorAction
): (Building | Character | Item | Tile)[];
function getInteractableTemplatesForFulfill(
	action: NeedBehaviorAction | ConditionBehaviorAction
): (Building | Character | Item | Tile)[] {
	const { getBuildingInteraction } = useBuilding();
	const { getItemInteraction } = useItem();
	const { getCharacterInteraction } = useCharacter();

	// 1. Fulfillment 가져오기
	let fulfillments: any[] = [];

	if ('need_id' in action) {
		const needAction = action;
		const { getAllNeedFulfillments, getNeedFulfillment } = useCharacter();

		if (needAction.need_fulfillment_id) {
			// 명시적 fulfillment
			const fulfillment = getNeedFulfillment(needAction.need_fulfillment_id as NeedFulfillmentId);
			if (fulfillment) fulfillments = [fulfillment];
		} else {
			// 자동 탐색: need_id로 필터링
			fulfillments = getAllNeedFulfillments().filter((f) => f.need_id === needAction.need_id);
		}
	} else {
		const conditionAction = action;
		const { getConditionFulfillment, getAllConditionFulfillments } = useBuilding();

		if (conditionAction.condition_fulfillment_id) {
			// 명시적 fulfillment
			const fulfillment = getConditionFulfillment(
				conditionAction.condition_fulfillment_id as ConditionFulfillmentId
			);
			if (fulfillment) fulfillments = [fulfillment];
		} else {
			// 자동 탐색: condition_id로 필터링
			fulfillments = getAllConditionFulfillments().filter(
				(f) => f.condition_id === conditionAction.condition_id
			);
		}
	}

	// 2. Fulfillment의 Interaction 가져오기 (repeat_interaction_type만)
	const interactions: (BuildingInteraction | ItemInteraction | CharacterInteraction)[] = [];

	for (const fulfillment of fulfillments) {
		if (fulfillment.building_interaction_id) {
			const interaction = getBuildingInteraction(
				fulfillment.building_interaction_id as BuildingInteractionId
			);
			if (interaction && interaction.repeat_interaction_type) {
				interactions.push(interaction);
			}
		} else if (fulfillment.item_interaction_id) {
			const interaction = getItemInteraction(fulfillment.item_interaction_id as ItemInteractionId);
			if (interaction && interaction.repeat_interaction_type) {
				interactions.push(interaction);
			}
		} else if (fulfillment.character_interaction_id) {
			const interaction = getCharacterInteraction(
				fulfillment.character_interaction_id as CharacterInteractionId
			);
			if (interaction && interaction.repeat_interaction_type) {
				interactions.push(interaction);
			}
		}
	}

	// 3. Interaction에서 엔티티 템플릿 추출
	return interactionsToTemplates(interactions);
}

/**
 * Interaction 배열을 EntityTemplate 배열로 변환합니다.
 * 기본 인터랙션(NULL entity_id)의 경우 모든 해당 타입 엔티티를 반환합니다.
 */
function interactionsToTemplates(
	interactions: (BuildingInteraction | ItemInteraction | CharacterInteraction)[]
): (Building | Character | Item | Tile)[] {
	const { getBuilding, getAllBuildings } = useBuilding();
	const { getAllItems, getItem } = useItem();
	const { getAllCharacters, getCharacter } = useCharacter();

	// ID 기준 중복 제거를 위해 Map 사용
	const templateMap = new Map<string, Building | Character | Item | Tile>();

	for (const interaction of interactions) {
		if ('building_id' in interaction) {
			// BuildingInteraction
			if (interaction.building_id) {
				// 특정 건물
				const building = getBuilding(interaction.building_id as BuildingId);
				if (building) templateMap.set(building.id, building);
			} else {
				// 기본 인터랙션: 모든 건물
				getAllBuildings().forEach((b) => templateMap.set(b.id, b));
			}
		} else if ('item_id' in interaction) {
			// ItemInteraction
			if (interaction.item_id) {
				// 특정 아이템
				const item = getItem(interaction.item_id as ItemId);
				if (item) templateMap.set(item.id, item);
			} else {
				// 기본 인터랙션: 모든 아이템
				getAllItems().forEach((i) => templateMap.set(i.id, i));
			}
		} else if ('target_character_id' in interaction) {
			// CharacterInteraction
			if (interaction.target_character_id) {
				// 특정 캐릭터
				const character = getCharacter(interaction.target_character_id as CharacterId);
				if (character) templateMap.set(character.id, character);
			} else {
				// 기본 인터랙션: 모든 캐릭터
				getAllCharacters().forEach((c) => templateMap.set(c.id, c));
			}
		}
	}

	return Array.from(templateMap.values());
}

/**
 * 다음 액션을 조회합니다.
 */
function getNextBehaviorAction(action: NeedBehaviorAction): NeedBehaviorAction | undefined;
function getNextBehaviorAction(
	action: ConditionBehaviorAction
): ConditionBehaviorAction | undefined;
function getNextBehaviorAction(
	action: NeedBehaviorAction | ConditionBehaviorAction
): (NeedBehaviorAction | ConditionBehaviorAction) | undefined {
	const { getNeedBehaviorAction, getConditionBehaviorAction } = useBehavior();

	if ('need_id' in action) {
		const needAction = action;
		if (!needAction.next_need_behavior_action_id) return undefined;
		return getNeedBehaviorAction(needAction.next_need_behavior_action_id as NeedBehaviorActionId);
	} else {
		const conditionAction = action;
		if (!conditionAction.next_condition_behavior_action_id) return undefined;
		return getConditionBehaviorAction(
			conditionAction.next_condition_behavior_action_id as ConditionBehaviorActionId
		);
	}
}

/**
 * 모든 엔티티 템플릿을 반환합니다.
 */
function getAllEntityTemplates(): (Building | Character | Item | Tile)[] {
	const { getAllBuildings } = useBuilding();
	const { getAllItems } = useItem();
	const { getAllCharacters } = useCharacter();

	const templates: (Building | Character | Item | Tile)[] = [];

	// 모든 건물
	templates.push(...getAllBuildings());

	// 모든 아이템
	templates.push(...getAllItems());

	// 모든 캐릭터
	templates.push(...getAllCharacters());

	return templates;
}

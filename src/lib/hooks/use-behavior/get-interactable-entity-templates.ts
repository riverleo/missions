import { get } from 'svelte/store';
import type {
	NeedBehaviorAction,
	ConditionBehaviorAction,
	EntityTemplate,
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
	BehaviorAction,
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
export function getInteractableEntityTemplates(behaviorAction: BehaviorAction): EntityTemplate[] {
	// NeedBehaviorAction인지 확인
	const isNeedAction = 'need_id' in behaviorAction;

	if (behaviorAction.type === 'go') {
		// go 타입: search 모드일 때만 대상 반환
		if (behaviorAction.target_selection_method !== 'search') {
			return [];
		}

		// 다음 액션 조회
		const nextAction = getNextAction(behaviorAction, isNeedAction);
		if (nextAction?.type === 'interact') {
			// INTERACT 다음에 FULFILL이 있는지 확인
			const nextNextAction = getNextAction(nextAction, isNeedAction);
			if (nextNextAction?.type === 'fulfill') {
				// INTERACT -> FULFILL 체인: FULFILL의 조건을 사용
				return getInteractableTemplatesForFulfill(nextNextAction, isNeedAction);
			}
			return getInteractableTemplatesForInteract(nextAction);
		} else if (nextAction?.type === 'fulfill') {
			return getInteractableTemplatesForFulfill(nextAction, isNeedAction);
		} else {
			// next가 idle이거나 없으면: 모든 엔티티 반환
			return getAllEntityTemplates();
		}
	} else if (behaviorAction.type === 'interact') {
		// interact 타입: Interaction 직접 참조
		return getInteractableTemplatesForInteract(behaviorAction);
	} else if (behaviorAction.type === 'fulfill') {
		// fulfill 타입: Fulfillment를 통해 Interaction 참조
		return getInteractableTemplatesForFulfill(behaviorAction, isNeedAction);
	}

	return [];
}

/**
 * interact 타입 액션의 상호작용 가능한 엔티티 템플릿을 반환합니다.
 */
function getInteractableTemplatesForInteract(
	action: BehaviorAction
): EntityTemplate[] {
	const { buildingInteractionStore } = useBuilding();
	const { itemInteractionStore } = useItem();
	const { characterInteractionStore } = useCharacter();

	const interactions: (BuildingInteraction | ItemInteraction | CharacterInteraction)[] = [];

	// 1. Interaction 목록 가져오기
	if (action.building_interaction_id) {
		// 명시적 building interaction
		const interaction =
			get(buildingInteractionStore).data[action.building_interaction_id as BuildingInteractionId];
		if (interaction) interactions.push(interaction);
	} else if (action.item_interaction_id) {
		// 명시적 item interaction
		const interaction =
			get(itemInteractionStore).data[action.item_interaction_id as ItemInteractionId];
		if (interaction) interactions.push(interaction);
	} else if (action.character_interaction_id) {
		// 명시적 character interaction
		const interaction =
			get(characterInteractionStore).data[
				action.character_interaction_id as CharacterInteractionId
			];
		if (interaction) interactions.push(interaction);
	} else {
		// search: once_interaction_type이 있는 모든 Interactions
		const buildingInteractions = Object.values(get(buildingInteractionStore).data).filter(
			(i) => i.once_interaction_type !== null
		);
		const itemInteractions = Object.values(get(itemInteractionStore).data).filter(
			(i) => i.once_interaction_type !== null
		);
		const characterInteractions = Object.values(get(characterInteractionStore).data).filter(
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
	action: BehaviorAction,
	isNeedAction: boolean
): EntityTemplate[] {
	const { buildingInteractionStore } = useBuilding();
	const { itemInteractionStore } = useItem();
	const { characterInteractionStore } = useCharacter();

	// 1. Fulfillment 가져오기
	let fulfillments: any[] = [];

	if (isNeedAction) {
		const needAction = action as NeedBehaviorAction;
		const { needFulfillmentStore } = useCharacter();

		if (needAction.need_fulfillment_id) {
			// 명시적 fulfillment
			const fulfillment =
				get(needFulfillmentStore).data[needAction.need_fulfillment_id as NeedFulfillmentId];
			if (fulfillment) fulfillments = [fulfillment];
		} else {
			// 자동 탐색: need_id로 필터링
			fulfillments = Object.values(get(needFulfillmentStore).data).filter(
				(f) => f.need_id === needAction.need_id
			);
		}
	} else {
		const conditionAction = action as ConditionBehaviorAction;
		const { conditionFulfillmentStore } = useBuilding();

		if (conditionAction.condition_fulfillment_id) {
			// 명시적 fulfillment
			const fulfillment =
				get(conditionFulfillmentStore).data[
					conditionAction.condition_fulfillment_id as ConditionFulfillmentId
				];
			if (fulfillment) fulfillments = [fulfillment];
		} else {
			// 자동 탐색: condition_id로 필터링
			fulfillments = Object.values(get(conditionFulfillmentStore).data).filter(
				(f) => f.condition_id === conditionAction.condition_id
			);
		}
	}

	// 2. Fulfillment의 Interaction 가져오기 (repeat_interaction_type만)
	const interactions: (BuildingInteraction | ItemInteraction | CharacterInteraction)[] = [];

	for (const fulfillment of fulfillments) {
		if (fulfillment.building_interaction_id) {
			const interaction =
				get(buildingInteractionStore).data[
					fulfillment.building_interaction_id as BuildingInteractionId
				];
			if (interaction && interaction.repeat_interaction_type) {
				interactions.push(interaction);
			}
		} else if (fulfillment.item_interaction_id) {
			const interaction =
				get(itemInteractionStore).data[fulfillment.item_interaction_id as ItemInteractionId];
			if (interaction && interaction.repeat_interaction_type) {
				interactions.push(interaction);
			}
		} else if (fulfillment.character_interaction_id) {
			const interaction =
				get(characterInteractionStore).data[
					fulfillment.character_interaction_id as CharacterInteractionId
				];
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
): EntityTemplate[] {
	const { buildingStore } = useBuilding();
	const { itemStore } = useItem();
	const { characterStore } = useCharacter();

	// ID 기준 중복 제거를 위해 Map 사용
	const templateMap = new Map<string, EntityTemplate>();

	for (const interaction of interactions) {
		if ('building_id' in interaction) {
			// BuildingInteraction
			if (interaction.building_id) {
				// 특정 건물
				const building = get(buildingStore).data[interaction.building_id as BuildingId];
				if (building) templateMap.set(building.id, building);
			} else {
				// 기본 인터랙션: 모든 건물
				Object.values(get(buildingStore).data).forEach((b) => templateMap.set(b.id, b));
			}
		} else if ('item_id' in interaction) {
			// ItemInteraction
			if (interaction.item_id) {
				// 특정 아이템
				const item = get(itemStore).data[interaction.item_id as ItemId];
				if (item) templateMap.set(item.id, item);
			} else {
				// 기본 인터랙션: 모든 아이템
				Object.values(get(itemStore).data).forEach((i) => templateMap.set(i.id, i));
			}
		} else if ('target_character_id' in interaction) {
			// CharacterInteraction
			if (interaction.target_character_id) {
				// 특정 캐릭터
				const character = get(characterStore).data[interaction.target_character_id as CharacterId];
				if (character) templateMap.set(character.id, character);
			} else {
				// 기본 인터랙션: 모든 캐릭터
				Object.values(get(characterStore).data).forEach((c) => templateMap.set(c.id, c));
			}
		}
	}

	return Array.from(templateMap.values());
}

/**
 * 다음 액션을 조회합니다.
 */
function getNextAction(
	action: BehaviorAction,
	isNeedAction: boolean
): (NeedBehaviorAction | ConditionBehaviorAction) | undefined {
	const { needBehaviorActionStore, conditionBehaviorActionStore } = useBehavior();

	if (isNeedAction) {
		const needAction = action as NeedBehaviorAction;
		if (!needAction.next_need_behavior_action_id) return undefined;
		return get(needBehaviorActionStore).data[
			needAction.next_need_behavior_action_id as NeedBehaviorActionId
		];
	} else {
		const conditionAction = action as ConditionBehaviorAction;
		if (!conditionAction.next_condition_behavior_action_id) return undefined;
		return get(conditionBehaviorActionStore).data[
			conditionAction.next_condition_behavior_action_id as ConditionBehaviorActionId
		];
	}
}

/**
 * 모든 엔티티 템플릿을 반환합니다.
 */
function getAllEntityTemplates(): EntityTemplate[] {
	const { buildingStore } = useBuilding();
	const { itemStore } = useItem();
	const { characterStore } = useCharacter();

	const templates: EntityTemplate[] = [];

	// 모든 건물
	templates.push(...Object.values(get(buildingStore).data));

	// 모든 아이템
	templates.push(...Object.values(get(itemStore).data));

	// 모든 캐릭터
	templates.push(...Object.values(get(characterStore).data));

	return templates;
}

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
} from '$lib/types';
import { useBuilding } from '../use-building';
import { useCharacter } from '../use-character';
import { useItem } from '../use-item';

/**
 * 액션의 타입과 Interaction 참조에 따라 상호작용 가능한 엔티티 템플릿 목록을 반환합니다.
 *
 * - interact 타입: once_interaction_type이 있는 Interaction의 엔티티 반환
 * - fulfill 타입: fulfillment의 repeat_interaction_type이 있는 Interaction의 엔티티 반환
 *
 * @param action - 행동 액션 (NeedBehaviorAction 또는 ConditionBehaviorAction)
 * @returns 상호작용 가능한 엔티티 템플릿 배열
 */
export function getInteractableEntityTemplates(
	action: NeedBehaviorAction | ConditionBehaviorAction
): EntityTemplate[] {
	// NeedBehaviorAction인지 확인
	const isNeedAction = 'need_id' in action;

	if (action.type === 'interact') {
		// interact 타입: Interaction 직접 참조
		return getInteractableTemplatesForInteract(action);
	} else if (action.type === 'fulfill') {
		// fulfill 타입: Fulfillment를 통해 Interaction 참조
		return getInteractableTemplatesForFulfill(action, isNeedAction);
	}

	return [];
}

/**
 * interact 타입 액션의 상호작용 가능한 엔티티 템플릿을 반환합니다.
 */
function getInteractableTemplatesForInteract(
	action: NeedBehaviorAction | ConditionBehaviorAction
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
	action: NeedBehaviorAction | ConditionBehaviorAction,
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

	// 2. Fulfillment의 Interaction 가져오기
	const interactions: (BuildingInteraction | ItemInteraction | CharacterInteraction)[] = [];

	for (const fulfillment of fulfillments) {
		if (fulfillment.building_interaction_id) {
			const interaction =
				get(buildingInteractionStore).data[
					fulfillment.building_interaction_id as BuildingInteractionId
				];
			if (interaction) interactions.push(interaction);
		} else if (fulfillment.item_interaction_id) {
			const interaction =
				get(itemInteractionStore).data[fulfillment.item_interaction_id as ItemInteractionId];
			if (interaction) interactions.push(interaction);
		} else if (fulfillment.character_interaction_id) {
			const interaction =
				get(characterInteractionStore).data[
					fulfillment.character_interaction_id as CharacterInteractionId
				];
			if (interaction) interactions.push(interaction);
		}
	}

	// 3. Interaction에서 엔티티 템플릿 추출
	return interactionsToTemplates(interactions);
}

/**
 * Interaction 배열을 EntityTemplate 배열로 변환합니다.
 */
function interactionsToTemplates(
	interactions: (BuildingInteraction | ItemInteraction | CharacterInteraction)[]
): EntityTemplate[] {
	const { buildingStore } = useBuilding();
	const { itemStore } = useItem();
	const { characterStore } = useCharacter();

	const templates: EntityTemplate[] = [];

	for (const interaction of interactions) {
		if ('building_id' in interaction) {
			// BuildingInteraction
			const building = get(buildingStore).data[interaction.building_id as BuildingId];
			if (building) templates.push(building);
		} else if ('item_id' in interaction) {
			// ItemInteraction
			const item = get(itemStore).data[interaction.item_id as ItemId];
			if (item) templates.push(item);
		} else if ('target_character_id' in interaction) {
			// CharacterInteraction
			const character = get(characterStore).data[interaction.target_character_id as CharacterId];
			if (character) templates.push(character);
		}
	}

	return templates;
}

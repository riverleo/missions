import { get } from 'svelte/store';
import type {
	NeedBehaviorAction,
	ConditionBehaviorAction,
	EntityTemplate,
	BuildingId,
	ItemId,
} from '$lib/types';
import { useBuilding } from '../use-building';
import { useCharacter } from '../use-character';
import { useItem } from '../use-item';

/**
 * 액션의 behavior_interact_type과 해당 욕구/컨디션의 fulfillment에 따라
 * 상호작용 가능한 엔티티 템플릿 목록을 반환합니다.
 *
 * - NeedBehaviorAction: need_fulfillments에 등록된 building/item만 반환
 * - ConditionBehaviorAction: building_conditions/condition_fulfillments에 등록된 building/item만 반환
 *
 * @param action - 행동 액션 (NeedBehaviorAction 또는 ConditionBehaviorAction)
 * @returns 상호작용 가능한 엔티티 템플릿 배열
 */
export function getInteractableEntityTemplates(
	action: NeedBehaviorAction | ConditionBehaviorAction
): EntityTemplate[] {
	const type = action.behavior_interact_type;

	// NeedBehaviorAction인지 확인 (need_id 존재 여부로 판단)
	const isNeedAction = 'need_id' in action;

	if (type.startsWith('building_')) {
		const { buildingStore } = useBuilding();
		const buildings = Object.values(get(buildingStore).data);

		if (isNeedAction) {
			const needAction = action as NeedBehaviorAction;
			const { needFulfillmentStore } = useCharacter();
			const fulfillments = Object.values(get(needFulfillmentStore).data).filter(
				(f) => f.need_id === needAction.need_id && f.fulfillment_type === 'building'
			);

			// 해당하는 fulfillment가 없으면 빈 배열 반환
			if (fulfillments.length === 0) return [];

			// building_id가 null인 fulfillment가 있으면 모든 건물 반환
			const hasNullBuilding = fulfillments.some((f) => f.building_id === null);
			if (hasNullBuilding) return buildings;

			// 특정 building_id만 필터링
			const fulfillmentBuildingIds = new Set(
				fulfillments.map((f) => f.building_id).filter((id): id is BuildingId => id !== null)
			);
			return buildings.filter((b) => fulfillmentBuildingIds.has(b.id));
		} else {
			// ConditionBehaviorAction의 경우 BuildingCondition에서 building_id 추출
			const conditionAction = action as ConditionBehaviorAction;
			const { buildingConditionStore } = useBuilding();
			const buildingConditions = Object.values(get(buildingConditionStore).data).filter(
				(bc) => bc.condition_id === conditionAction.condition_id
			);

			// 해당하는 buildingCondition이 없으면 빈 배열 반환
			if (buildingConditions.length === 0) return [];

			// building_id가 null인 condition이 있으면 모든 건물 반환
			const hasNullBuilding = buildingConditions.some((bc) => bc.building_id === null);
			if (hasNullBuilding) return buildings;

			// 특정 building_id만 필터링
			const fulfillmentBuildingIds = new Set(buildingConditions.map((bc) => bc.building_id));
			return buildings.filter((b) => fulfillmentBuildingIds.has(b.id));
		}
	} else if (type.startsWith('item_')) {
		const { itemStore } = useItem();
		const items = Object.values(get(itemStore).data);

		if (isNeedAction) {
			const needAction = action as NeedBehaviorAction;
			const { needFulfillmentStore } = useCharacter();
			const fulfillments = Object.values(get(needFulfillmentStore).data).filter(
				(f) => f.need_id === needAction.need_id && f.fulfillment_type === 'item'
			);

			// 해당하는 fulfillment가 없으면 빈 배열 반환
			if (fulfillments.length === 0) return [];

			// item_id가 null인 fulfillment가 있으면 모든 아이템 반환
			const hasNullItem = fulfillments.some((f) => f.item_id === null);
			if (hasNullItem) return items;

			// 특정 item_id만 필터링
			const fulfillmentItemIds = new Set(
				fulfillments.map((f) => f.item_id).filter((id): id is ItemId => id !== null)
			);
			return items.filter((i) => fulfillmentItemIds.has(i.id));
		} else {
			const conditionAction = action as ConditionBehaviorAction;
			const { conditionFulfillmentStore } = useBuilding();
			const fulfillments = Object.values(get(conditionFulfillmentStore).data).filter(
				(f) => f.condition_id === conditionAction.condition_id && f.fulfillment_type === 'item'
			);

			// 해당하는 fulfillment가 없으면 빈 배열 반환
			if (fulfillments.length === 0) return [];

			// item_id가 null인 fulfillment가 있으면 모든 아이템 반환
			const hasNullItem = fulfillments.some((f) => f.item_id === null);
			if (hasNullItem) return items;

			// 특정 item_id만 필터링
			const fulfillmentItemIds = new Set(
				fulfillments.map((f) => f.item_id).filter((id): id is ItemId => id !== null)
			);
			return items.filter((i) => fulfillmentItemIds.has(i.id));
		}
	}

	return [];
}

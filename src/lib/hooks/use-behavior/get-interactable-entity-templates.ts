import { get } from 'svelte/store';
import type { BehaviorAction, EntityTemplate } from '$lib/types';
import { useBuilding } from '../use-building';
import { useItem } from '../use-item';

/**
 * 액션의 behavior_interact_type에 따라 상호작용 가능한 엔티티 템플릿 목록을 반환합니다.
 *
 * - building_* 타입: Building 목록 반환
 * - item_* 타입: Item 목록 반환
 *
 * @param action - 행동 액션 (NeedBehaviorAction 또는 ConditionBehaviorAction)
 * @returns 상호작용 가능한 엔티티 템플릿 배열
 */
export function getInteractableEntityTemplates(action: BehaviorAction): EntityTemplate[] {
	const type = action.behavior_interact_type;

	if (type.startsWith('building_')) {
		const { buildingStore } = useBuilding();
		return Object.values(get(buildingStore).data);
	} else if (type.startsWith('item_')) {
		const { itemStore } = useItem();
		return Object.values(get(itemStore).data);
	}

	return [];
}

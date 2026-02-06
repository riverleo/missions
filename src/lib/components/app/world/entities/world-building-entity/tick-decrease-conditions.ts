import { useBuilding } from '$lib/hooks';
import { get } from 'svelte/store';
import type { WorldBuildingEntity } from './world-building-entity.svelte';

/**
 * 건물의 컨디션을 tick마다 감소시킵니다.
 */
export default function tickDecreaseConditions(this: WorldBuildingEntity, tick: number): void {
	// 모든 conditions를 decrease_per_tick * multiplier만큼 감소
	const { conditionStore, buildingConditionStore } = useBuilding();
	const conditions = get(conditionStore).data;
	const buildingConditions = get(buildingConditionStore).data;

	for (const worldBuildingCondition of Object.values(this.worldBuildingConditions)) {
		const condition = conditions[worldBuildingCondition.condition_id];
		const buildingCondition = buildingConditions[worldBuildingCondition.building_condition_id];
		if (!condition || !buildingCondition) continue;

		const decreaseAmount = condition.decrease_per_tick * buildingCondition.decrease_multiplier;
		worldBuildingCondition.value = Math.max(0, worldBuildingCondition.value - decreaseAmount);
	}
}

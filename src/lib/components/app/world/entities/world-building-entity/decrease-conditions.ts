import { useBuilding } from '$lib/hooks';
import { get } from 'svelte/store';
import type { WorldBuildingEntity } from './world-building-entity.svelte';

export function decreaseConditions(entity: WorldBuildingEntity): void {
	// 모든 conditions를 decrease_per_tick * multiplier만큼 감소
	const { conditionStore, buildingConditionStore } = useBuilding();
	const conditions = get(conditionStore).data;
	const buildingConditions = get(buildingConditionStore).data;

	for (const worldBuildingCondition of Object.values(entity.worldBuildingConditions)) {
		const condition = conditions[worldBuildingCondition.condition_id];
		const buildingCondition = buildingConditions[worldBuildingCondition.building_condition_id];
		if (!condition || !buildingCondition) continue;

		const decreaseAmount = condition.decrease_per_tick * buildingCondition.decrease_multiplier;
		worldBuildingCondition.value = Math.max(0, worldBuildingCondition.value - decreaseAmount);
	}
}

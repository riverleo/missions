import { useBuilding, useWorld } from '$lib/hooks';
import { get } from 'svelte/store';
import type { WorldContext } from './world-context.svelte';
import type { WorldBuildingId } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { WorldBuildingEntity } from '../entities/world-building-entity';

export function createWorldBuilding(
	worldContext: WorldContext,
	insert: Omit<Parameters<ReturnType<typeof useWorld>['createWorldBuilding']>[0], 'world_id'>
) {
	const world = useWorld();
	const { conditionStore, getAllBuildingConditions } = useBuilding();

	// useWorld CRUD로 데이터 생성
	const worldBuilding = world.createWorldBuilding({ ...insert, world_id: worldContext.worldId });

	// BuildingCondition 템플릿에서 conditions 조회 후 WorldBuildingConditions 생성
	const buildingConditions = getAllBuildingConditions().filter(
		(bc) => bc.building_id === insert.building_id
	);
	const conditions = get(conditionStore).data;
	const worldBuildingConditions = world.createWorldBuildingConditions(
		{
			world_id: worldContext.worldId,
			world_building_id: worldBuilding.id,
			building_id: insert.building_id,
		},
		buildingConditions.map((bc) => ({
			building_condition_id: bc.id,
			condition_id: bc.condition_id,
			value: conditions[bc.condition_id]?.initial_value ?? 100,
		}))
	);

	// 엔티티 생성
	const entity = new WorldBuildingEntity(worldContext, worldContext.worldId, worldBuilding.id);

	// conditions를 엔티티에 설정 (spread로 복사하여 프록시 해제)
	entity.worldBuildingConditions = {};
	for (const condition of worldBuildingConditions) {
		entity.worldBuildingConditions[condition.condition_id] = { ...condition };
	}

	entity.addToWorld();
}

export function deleteWorldBuilding(
	worldBuildingId: WorldBuildingId,
	worldContext?: WorldContext
) {
	const { getWorldBuilding, deleteWorldBuilding: hookDelete, deleteWorldBuildingConditionsByBuilding } =
		useWorld();
	const worldBuilding = getWorldBuilding(worldBuildingId);
	if (!worldBuilding) return;

	// worldContext가 있으면 엔티티 제거
	if (worldContext) {
		const entityId = EntityIdUtils.create(
			'building',
			worldContext.worldId,
			worldBuilding.building_id,
			worldBuildingId
		);
		const entity = worldContext.entities[entityId];
		if (entity) {
			entity.removeFromWorld();
		}
	}

	// 스토어에서 제거 (useWorld CRUD)
	deleteWorldBuildingConditionsByBuilding(worldBuildingId);
	hookDelete(worldBuildingId);
}

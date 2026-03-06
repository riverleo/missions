import { useBuilding, useCurrent, useWorld } from '$lib/hooks';
import { get } from 'svelte/store';
import type { WorldContext } from './world-context.svelte';
import type {
	WorldBuilding,
	WorldBuildingId,
	WorldBuildingInsert,
	WorldBuildingCondition,
	WorldBuildingConditionId,
} from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { WorldBuildingEntity } from '../entities/world-building-entity';

export function createWorldBuilding(
	worldContext: WorldContext,
	insert: Required<
		Omit<
			WorldBuildingInsert,
			| 'id'
			| 'world_id'
			| 'player_id'
			| 'scenario_id'
			| 'user_id'
			| 'created_at'
			| 'created_at_tick'
			| 'deleted_at'
		>
	> &
		Pick<WorldBuildingInsert, 'id' | 'created_at' | 'created_at_tick'>
) {
	const { setWorldBuilding, setWorldBuildingConditions, getAllWorldBuildingConditions } =
		useWorld();

	const { playerStore, playerScenarioStore, tickStore } = useCurrent();
	const player = get(playerStore);
	const playerScenario = get(playerScenarioStore);
	const player_id = player!.id;
	const scenario_id = playerScenario!.scenario_id;
	const user_id = player!.user_id;

	// 클라이언트에서 UUID 생성
	const worldBuildingId = crypto.randomUUID() as WorldBuildingId;
	const { conditionStore, getAllBuildingConditions } = useBuilding();
	const buildingConditions = getAllBuildingConditions().filter(
		(bc) => bc.building_id === insert.building_id
	);
	const conditions = get(conditionStore).data;

	const worldBuilding: WorldBuilding = {
		...insert,
		id: worldBuildingId,
		user_id,
		world_id: worldContext.worldId,
		player_id,
		scenario_id,
		created_at: new Date().toISOString(),
		created_at_tick: get(tickStore),
		deleted_at: null,
	};

	// WorldBuildingCondition 생성
	const worldBuildingConditions: WorldBuildingCondition[] = buildingConditions.map((bc) => ({
		id: crypto.randomUUID() as WorldBuildingConditionId,
		user_id,
		world_id: worldContext.worldId,
		player_id,
		scenario_id,
		building_id: insert.building_id,
		world_building_id: worldBuildingId,
		building_condition_id: bc.id,
		condition_id: bc.condition_id,
		value: conditions[bc.condition_id]?.initial_value ?? 100,
		created_at: new Date().toISOString(),
		deleted_at: null,
	}));

	// 스토어 업데이트 (useWorld CRUD)
	setWorldBuildingConditions(worldBuildingConditions);
	setWorldBuilding(worldBuilding);

	// 엔티티 생성
	const entity = new WorldBuildingEntity(worldContext, worldContext.worldId, worldBuilding.id);

	// 스토어에서 conditions를 다시 불러와서 설정 (spread로 복사하여 프록시 해제)
	const entityBuildingConditions = getAllWorldBuildingConditions().filter(
		(condition) => condition.world_building_id === worldBuilding.id
	);
	entity.worldBuildingConditions = {};
	for (const condition of entityBuildingConditions) {
		entity.worldBuildingConditions[condition.condition_id] = { ...condition };
	}

	entity.addToWorld();
}

export function deleteWorldBuilding(
	worldBuildingId: WorldBuildingId,
	worldContext?: WorldContext
) {
	const { getWorldBuilding, removeWorldBuilding, removeWorldBuildingConditionsByBuilding } =
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
	removeWorldBuildingConditionsByBuilding(worldBuildingId);
	removeWorldBuilding(worldBuildingId);
}

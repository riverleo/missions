import { get } from 'svelte/store';
import type { WorldContext } from './world-context.svelte';
import type {
	WorldBuilding,
	WorldBuildingId,
	WorldBuildingInsert,
	WorldBuildingConditionId,
} from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { useWorld } from '$lib/hooks/use-world';
import { useCurrent } from '$lib/hooks/use-current';
import { useApp } from '$lib/hooks/use-app.svelte';
import { useCondition } from '$lib/hooks/use-condition';
import { WorldBuildingEntity } from '../entities/world-building-entity';
import { TEST_WORLD_ID } from '$lib/constants';

export async function createWorldBuilding(
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
	const { worldBuildingStore } = useWorld();
	const isTestWorld = worldContext.worldId === TEST_WORLD_ID;

	const { playerStore, playerScenarioStore, tickStore } = useCurrent();
	const player = get(playerStore);
	const playerScenario = get(playerScenarioStore);
	const player_id = player!.id;
	const scenario_id = playerScenario!.scenario_id;
	const user_id = player!.user_id;

	let worldBuilding: WorldBuilding;

	if (isTestWorld) {
		// TEST 환경: 클라이언트에서 UUID 생성
		const worldBuildingId = crypto.randomUUID() as WorldBuildingId;
		const { buildingConditionStore, conditionStore } = useCondition();
		const buildingConditions = Object.values(get(buildingConditionStore).data).filter(
			(bc) => bc.building_id === insert.building_id
		);
		const conditions = get(conditionStore).data;

		worldBuilding = {
			...insert,
			id: worldBuildingId,
			user_id,
			world_id: worldContext.worldId,
			player_id,
			scenario_id,
			created_at: new Date().toISOString(),
			created_at_tick: get(tickStore),
			conditions: buildingConditions.map((bc) => ({
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
			})),
			deleted_at: null,
		};
	} else {
		// 프로덕션 환경: 서버에 저장하고 반환된 데이터 사용
		const { supabase } = useApp();

		// WorldBuilding insert
		const insertData = {
			...insert,
			world_id: worldContext.worldId,
			player_id,
			scenario_id,
			user_id,
			created_at_tick: get(tickStore),
		};

		const { data: insertResult, error: insertError } = await supabase
			.from('world_buildings')
			.insert(insertData)
			.select('id')
			.single<{ id: WorldBuildingId }>();

		if (insertError || !insertResult) {
			console.error('Failed to create world building:', insertError);
			throw insertError;
		}

		const worldBuildingId = insertResult.id;

		// WorldBuildingCondition insert
		const { buildingConditionStore, conditionStore } = useCondition();
		const buildingConditions = Object.values(get(buildingConditionStore).data).filter(
			(bc) => bc.building_id === insert.building_id
		);

		if (buildingConditions.length > 0) {
			const conditions = get(conditionStore).data;

			const worldBuildingConditionsInserts = buildingConditions.map((bc) => ({
				scenario_id,
				user_id,
				player_id,
				world_id: worldContext.worldId,
				building_id: insert.building_id,
				world_building_id: worldBuildingId,
				building_condition_id: bc.id,
				condition_id: bc.condition_id,
				value: conditions[bc.condition_id]?.initial_value ?? 100,
			}));

			const { error: conditionsError } = await supabase
				.from('world_building_conditions')
				.insert(worldBuildingConditionsInserts);

			if (conditionsError) {
				console.error('Failed to create world building conditions:', conditionsError);
			}
		}

		// WorldBuilding selectOne
		const { data, error } = await supabase
			.from('world_buildings')
			.select('*')
			.eq('id', worldBuildingId)
			.single<WorldBuilding>();

		if (error || !data) {
			console.error('Failed to fetch world building:', error);
			throw error;
		}

		worldBuilding = data;
	}

	// 스토어 업데이트
	worldBuildingStore.update((state) => ({
		...state,
		data: { ...state.data, [worldBuilding.id]: worldBuilding },
	}));

	// 엔티티 생성
	const entity = new WorldBuildingEntity(worldContext, worldContext.worldId, worldBuilding.id);
	entity.addToWorld();
}

export async function deleteWorldBuilding(
	worldContext: WorldContext,
	worldBuildingId: WorldBuildingId
) {
	const { worldBuildingStore } = useWorld();
	const isTestWorld = worldContext.worldId === TEST_WORLD_ID;

	// 프로덕션 환경이면 서버에서 soft delete
	if (!isTestWorld) {
		const { supabase } = useApp();
		const { error } = await supabase
			.from('world_buildings')
			.update({ deleted_at: new Date().toISOString() })
			.eq('id', worldBuildingId);

		if (error) {
			console.error('Failed to delete world building:', error);
			throw error;
		}
	}

	// 엔티티 제거
	const entityId = EntityIdUtils.createId('building', worldContext.worldId, worldBuildingId);
	const entity = worldContext.entities[entityId];
	if (entity) {
		entity.removeFromWorld();
	}

	// 스토어 업데이트
	worldBuildingStore.update((state) => {
		const newData = { ...state.data };
		delete newData[worldBuildingId];
		return { ...state, data: newData };
	});
}

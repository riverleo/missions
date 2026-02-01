import { get } from 'svelte/store';
import { produce } from 'immer';
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
import { useBuilding } from '$lib/hooks/use-building';
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
	const { worldBuildingStore, getAllWorldBuildingConditions, getWorldBuilding } = useWorld();
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
		const { worldBuildingConditionStore, getAllWorldBuildingConditions, getWorldBuilding } = useWorld();
		const { buildingConditionStore, conditionStore, getAllBuildingConditions } = useBuilding();
		const buildingConditions = getAllBuildingConditions().filter(
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
			deleted_at: null,
		};

		// WorldBuildingCondition을 별도 스토어에 저장
		const worldBuildingConditions = buildingConditions.map((bc) => ({
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

		worldBuildingConditionStore.update((state) => {
			const newData = { ...state.data };
			for (const condition of worldBuildingConditions) {
				newData[condition.id] = condition;
			}
			return { ...state, data: newData };
		});
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
		const { buildingConditionStore, conditionStore, getAllBuildingConditions } = useBuilding();
		const buildingConditions = getAllBuildingConditions().filter(
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
	worldBuildingStore.update((state) =>
		produce(state, (draft) => {
			draft.data[worldBuilding.id] = worldBuilding;
		})
	);

	// 엔티티 생성
	const entity = new WorldBuildingEntity(worldContext, worldContext.worldId, worldBuilding.id);

	// TEST 환경에서는 스토어에서 conditions를 다시 불러와서 설정 (spread로 복사하여 프록시 해제)
	if (isTestWorld) {
		const { worldBuildingConditionStore, getAllWorldBuildingConditions, getWorldBuilding } = useWorld();
		const buildingConditions = getAllWorldBuildingConditions().filter(
			(condition) => condition.world_building_id === worldBuilding.id
		);
		entity.worldBuildingConditions = {};
		for (const condition of buildingConditions) {
			entity.worldBuildingConditions[condition.condition_id] = { ...condition };
		}
	}

	entity.addToWorld();
}

export async function deleteWorldBuilding(
	worldBuildingId: WorldBuildingId,
	worldContext?: WorldContext
) {
	const { worldBuildingStore, worldBuildingConditionStore, getAllWorldBuildingConditions, getWorldBuilding } = useWorld();
	const worldBuilding = getWorldBuilding(worldBuildingId);
	if (!worldBuilding) return;

	const isTestWorld = worldBuilding.world_id === TEST_WORLD_ID;

	// 프로덕션 환경이면 서버에서 soft delete
	if (!isTestWorld) {
		const { supabase } = useApp();
		const deletedAt = new Date().toISOString();

		const [buildingResult, conditionsResult] = await Promise.all([
			supabase
				.from('world_buildings')
				.update({ deleted_at: deletedAt })
				.eq('id', worldBuildingId),
			supabase
				.from('world_building_conditions')
				.update({ deleted_at: deletedAt })
				.eq('world_building_id', worldBuildingId),
		]);

		if (buildingResult.error) {
			console.error('Failed to delete world building:', buildingResult.error);
			throw buildingResult.error;
		}

		if (conditionsResult.error) {
			console.error('Failed to delete world building conditions:', conditionsResult.error);
			throw conditionsResult.error;
		}
	}

	// worldContext가 있으면 엔티티 제거
	if (worldContext) {
		const entityId = EntityIdUtils.createId('building', worldContext.worldId, worldBuildingId);
		const entity = worldContext.entities[entityId];
		if (entity) {
			entity.removeFromWorld();
		}
	}

	// WorldBuildingCondition 제거
	worldBuildingConditionStore.update((state) =>
		produce(state, (draft) => {
			for (const [id, condition] of Object.entries(draft.data)) {
				if (condition?.world_building_id === worldBuildingId) {
					delete draft.data[id as WorldBuildingConditionId];
				}
			}
		})
	);

	// 스토어 업데이트
	worldBuildingStore.update((state) => {
		const newData = { ...state.data };
		delete newData[worldBuildingId];
		return { ...state, data: newData };
	});
}

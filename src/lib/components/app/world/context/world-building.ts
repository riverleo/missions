import { get } from 'svelte/store';
import type { WorldContext } from './world-context.svelte';
import type { WorldBuilding, WorldBuildingId, WorldBuildingInsert, UserId } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { useWorld } from '$lib/hooks/use-world';
import { usePlayer } from '$lib/hooks/use-player';
import { useServerPayload } from '$lib/hooks/use-server-payload.svelte';
import { WorldBuildingEntity } from '../entities/world-building-entity';
import {
	TEST_WORLD_ID,
	TEST_PLAYER_ID,
	TEST_SCENARIO_ID,
} from '$lib/hooks/use-world/use-world-test';

export async function createWorldBuilding(
	worldContext: WorldContext,
	insert: Required<
		Omit<
			WorldBuildingInsert,
			'id' | 'world_id' | 'player_id' | 'scenario_id' | 'user_id' | 'created_at' | 'created_at_tick'
		>
	> &
		Pick<WorldBuildingInsert, 'id' | 'created_at' | 'created_at_tick'>
) {
	const { worldBuildingStore } = useWorld();
	const isTestWorld = worldContext.worldId === TEST_WORLD_ID;

	let player_id, scenario_id, user_id;
	if (isTestWorld) {
		player_id = TEST_PLAYER_ID;
		scenario_id = TEST_SCENARIO_ID;
		user_id = crypto.randomUUID() as UserId;
	} else {
		const player = get(usePlayer().current);
		const world = get(useWorld().worldStore).data[worldContext.worldId];
		player_id = player!.id;
		scenario_id = world!.scenario_id;
		user_id = player!.user_id;
	}

	let worldBuilding: WorldBuilding;

	if (isTestWorld) {
		// TEST 환경: 클라이언트에서 UUID 생성
		worldBuilding = {
			...insert,
			id: crypto.randomUUID() as WorldBuildingId,
			world_id: worldContext.worldId,
			player_id,
			scenario_id,
			user_id,
			created_at: new Date().toISOString(),
			created_at_tick: 0,
		};
	} else {
		// 프로덕션 환경: 서버에 저장하고 반환된 데이터 사용
		const { supabase } = useServerPayload();
		const { data, error } = await supabase
			.from('world_buildings')
			.insert({
				...insert,
				world_id: worldContext.worldId,
				player_id,
				scenario_id,
				user_id,
			})
			.select()
			.single<WorldBuilding>();

		if (error || !data) {
			console.error('Failed to create world building:', error);
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

	// 프로덕션 환경이면 서버에서 삭제
	if (!isTestWorld) {
		const { supabase } = useServerPayload();
		const { error } = await supabase.from('world_buildings').delete().eq('id', worldBuildingId);

		if (error) {
			console.error('Failed to delete world building:', error);
			throw error;
		}
	}

	// 엔티티 제거
	const entityId = EntityIdUtils.create('building', worldContext.worldId, worldBuildingId);
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

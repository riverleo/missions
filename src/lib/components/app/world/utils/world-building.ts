import { get } from 'svelte/store';
import type { WorldContext } from '../context';
import type { WorldBuilding, WorldBuildingId, WorldBuildingInsert, UserId } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { useWorld } from '$lib/hooks/use-world';
import { usePlayer } from '$lib/hooks/use-player';
import { WorldBuildingEntity } from '../entities/world-building-entity';
import {
	TEST_WORLD_ID,
	TEST_PLAYER_ID,
	TEST_SCENARIO_ID,
} from '$lib/hooks/use-world/use-world-test';

export function createWorldBuilding(
	worldContext: WorldContext,
	insert: Omit<WorldBuildingInsert, 'world_id' | 'player_id' | 'scenario_id' | 'user_id'>
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

	const worldBuilding: WorldBuilding = {
		id: crypto.randomUUID() as WorldBuildingId,
		...insert,
		world_id: worldContext.worldId,
		player_id,
		scenario_id,
		user_id,
		created_at: new Date().toISOString(),
		created_at_tick: 0,
	} as WorldBuilding;

	// 스토어 업데이트
	worldBuildingStore.update((state) => ({
		...state,
		data: { ...state.data, [worldBuilding.id]: worldBuilding },
	}));

	// 엔티티 생성
	const entity = new WorldBuildingEntity(worldContext, worldContext.worldId, worldBuilding.id);
	entity.addToWorld();
}

export function deleteWorldBuilding(
	worldContext: WorldContext,
	worldBuildingId: WorldBuildingId
) {
	const { worldBuildingStore } = useWorld();

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

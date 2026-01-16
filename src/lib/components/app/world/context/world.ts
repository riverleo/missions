import type { UserId, World, WorldId, WorldInsert } from '$lib/types';
import { useWorld } from '$lib/hooks/use-world';
import { TEST_USER_ID, TEST_PLAYER_ID, TEST_SCENARIO_ID } from '$lib/hooks/use-world';
import { createWorldTileMap, deleteWorldTileMap } from './world-tile-map';

export function createWorld(insert: Omit<WorldInsert, 'user_id' | 'player_id' | 'scenario_id'>) {
	const { worldStore } = useWorld();

	const world: World = {
		id: crypto.randomUUID() as WorldId,
		user_id: TEST_USER_ID,
		player_id: TEST_PLAYER_ID,
		scenario_id: TEST_SCENARIO_ID,
		...insert,
		created_at: new Date().toISOString(),
	} as World;

	// 스토어 업데이트
	worldStore.update((state) => ({
		...state,
		data: { ...state.data, [world.id]: world },
	}));

	// terrain_id가 있으면 worldTileMap 자동 생성
	if (world.terrain_id) {
		createWorldTileMap({
			world_id: world.id,
			terrain_id: world.terrain_id,
			player_id: world.player_id,
			scenario_id: world.scenario_id,
			user_id: world.user_id,
		});
	}

	return world;
}

export function deleteWorld(worldId: WorldId) {
	const { worldStore } = useWorld();

	// worldTileMap 먼저 삭제
	deleteWorldTileMap(worldId);

	// world 삭제
	worldStore.update((state) => {
		const newData = { ...state.data };
		delete newData[worldId];
		return { ...state, data: newData };
	});
}

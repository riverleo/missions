import { useWorld } from '$lib/hooks';
import type {
	World,
	WorldId,
	WorldInsert,
} from '$lib/types';
import type { WorldContext } from './world-context.svelte';
import { TEST_USER_ID, TEST_PLAYER_ID, TEST_SCENARIO_ID } from '$lib/constants';
import { createWorldTileMap, deleteWorldTileMap } from './world-tile-map';
import { deleteWorldCharacter } from './world-character';
import { deleteWorldBuilding } from './world-building';
import { deleteWorldItem } from './world-item';

export function createWorld(insert: Omit<WorldInsert, 'user_id' | 'player_id' | 'scenario_id'>) {
	const { setWorld } = useWorld();

	const world: World = {
		id: crypto.randomUUID() as WorldId,
		user_id: TEST_USER_ID,
		player_id: TEST_PLAYER_ID,
		scenario_id: TEST_SCENARIO_ID,
		...insert,
		created_at: new Date().toISOString(),
	} as World;

	// 스토어 업데이트 (useWorld CRUD)
	setWorld(world);

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

export async function deleteWorld(worldId: WorldId, worldContext?: WorldContext) {
	const { getAllWorldCharacters, getAllWorldBuildings, getAllWorldItems, removeWorld } = useWorld();

	// 해당 worldId의 엔티티 삭제
	const characters = getAllWorldCharacters().filter((c) => c.world_id === worldId);
	const buildings = getAllWorldBuildings().filter((b) => b.world_id === worldId);
	const items = getAllWorldItems().filter((i) => i.world_id === worldId);

	for (const character of characters) {
		deleteWorldCharacter(character.id, worldContext);
	}

	for (const building of buildings) {
		deleteWorldBuilding(building.id, worldContext);
	}

	for (const item of items) {
		deleteWorldItem(item.id, worldContext);
	}

	// worldTileMap 삭제
	deleteWorldTileMap(worldId);

	// world 삭제 (useWorld CRUD)
	removeWorld(worldId);
}

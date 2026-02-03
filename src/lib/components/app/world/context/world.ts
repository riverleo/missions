import { useWorld } from '$lib/hooks';
import { get } from 'svelte/store';
import type {
	World,
	WorldId,
	WorldInsert,
	WorldCharacterId,
	WorldBuildingId,
	WorldItemId,
} from '$lib/types';
import type { WorldContext } from './world-context.svelte';
import { TEST_USER_ID, TEST_PLAYER_ID, TEST_SCENARIO_ID } from '$lib/constants';
import { createWorldTileMap, deleteWorldTileMap } from './world-tile-map';
import { deleteWorldCharacter } from './world-character';
import { deleteWorldBuilding } from './world-building';
import { deleteWorldItem } from './world-item';

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

export async function deleteWorld(worldId: WorldId, worldContext?: WorldContext) {
	const { worldStore, worldCharacterStore, worldBuildingStore, worldItemStore } = useWorld();

	// 스토어에서 해당 world_id의 엔티티 ID 목록 수집
	const characterIds = Object.entries(get(worldCharacterStore).data)
		.filter(([_, character]) => character?.world_id === worldId)
		.map(([id]) => id as WorldCharacterId);

	const buildingIds = Object.entries(get(worldBuildingStore).data)
		.filter(([_, building]) => building?.world_id === worldId)
		.map(([id]) => id as WorldBuildingId);

	const itemIds = Object.entries(get(worldItemStore).data)
		.filter(([_, item]) => item?.world_id === worldId)
		.map(([id]) => id as WorldItemId);

	// 각 delete 함수 호출 (각 함수가 worldContext 처리)
	const deletePromises: Promise<void>[] = [];

	for (const characterId of characterIds) {
		deletePromises.push(deleteWorldCharacter(characterId, worldContext));
	}

	for (const buildingId of buildingIds) {
		deletePromises.push(deleteWorldBuilding(buildingId, worldContext));
	}

	for (const itemId of itemIds) {
		deletePromises.push(deleteWorldItem(itemId, worldContext));
	}

	await Promise.all(deletePromises);

	// worldTileMap 삭제
	deleteWorldTileMap(worldId);

	// world 삭제
	worldStore.update((state) => {
		const newData = { ...state.data };
		delete newData[worldId];
		return { ...state, data: newData };
	});
}

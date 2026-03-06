import { useWorld } from '$lib/hooks';
import type { WorldData, WorldId } from '$lib/types';
import type { WorldContext } from './world-context.svelte';
import { deleteWorldCharacter } from './world-character';
import { deleteWorldBuilding } from './world-building';
import { deleteWorldItem } from './world-item';

export function createWorld(
	insert: Pick<WorldData, 'name' | 'terrain_id'> & Partial<Pick<WorldData, 'id'>>
) {
	const world = useWorld();
	return world.createWorld(insert);
}

export async function deleteWorld(worldId: WorldId, worldContext?: WorldContext) {
	const world = useWorld();
	const { getAllWorldCharacters, getAllWorldBuildings, getAllWorldItems } = world;

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
	world.deleteWorldTileMap(worldId);

	// world 삭제 (useWorld CRUD)
	world.deleteWorld(worldId);
}

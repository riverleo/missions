import type { WorldContext } from './world-context.svelte';
import type { TileCellKey } from '$lib/types';
import { useWorld } from '$lib/hooks/use-world';
import { WorldCharacterEntity } from '../entities/world-character-entity';
import { WorldBuildingEntity } from '../entities/world-building-entity';
import { WorldItemEntity } from '../entities/world-item-entity';
import { WorldTileEntity } from '../entities/world-tile-entity';

export function initializeEntities(worldContext: WorldContext) {
	const {
		worldTileMapStore,
		worldBuildingStore,
		worldCharacterStore,
		worldItemStore,
		getAllWorldBuildings,
		getAllWorldCharacters,
		getAllWorldItems,
		getWorldTileMap,
	} = useWorld();

	// 현재 worldId에 해당하는 데이터만 필터링
	const characters = getAllWorldCharacters().filter((c) => c.world_id === worldContext.worldId);
	const buildings = getAllWorldBuildings().filter((b) => b.world_id === worldContext.worldId);
	const items = getAllWorldItems().filter(
		(i) =>
			i.world_id === worldContext.worldId &&
			i.world_building_id === null &&
			i.world_character_id === null
	);
	const worldTileMap = getWorldTileMap(worldContext.worldId);

	// 캐릭터 엔티티 생성
	for (const character of characters) {
		try {
			const entity = new WorldCharacterEntity(worldContext, worldContext.worldId, character.id);
			entity.addToWorld();
		} catch (error) {
			console.warn('Skipping character creation:', error);
		}
	}

	// 건물 엔티티 생성
	for (const building of buildings) {
		try {
			const entity = new WorldBuildingEntity(worldContext, worldContext.worldId, building.id);
			entity.addToWorld();
		} catch (error) {
			console.warn('Skipping building creation:', error);
		}
	}

	// 아이템 엔티티 생성
	for (const item of items) {
		try {
			const entity = new WorldItemEntity(worldContext, worldContext.worldId, item.id);
			entity.addToWorld();
		} catch (error) {
			console.warn('Skipping item creation:', error);
		}
	}

	// 타일 엔티티 생성
	if (worldTileMap) {
		for (const [tileCellKey, tileData] of Object.entries(worldTileMap.data)) {
			try {
				const entity = new WorldTileEntity(
					worldContext,
					worldContext.worldId,
					tileCellKey as TileCellKey,
					tileData.tile_id
				);
				entity.addToWorld();
			} catch (error) {
				console.warn('Skipping tile creation:', error);
			}
		}
	}
}

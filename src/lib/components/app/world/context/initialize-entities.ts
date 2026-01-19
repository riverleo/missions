import { get } from 'svelte/store';
import type { WorldContext } from './world-context.svelte';
import type { TileCellKey } from '$lib/types';
import { useWorld } from '$lib/hooks/use-world';
import { WorldCharacterEntity } from '../entities/world-character-entity';
import { WorldBuildingEntity } from '../entities/world-building-entity';
import { WorldItemEntity } from '../entities/world-item-entity';
import { WorldTileEntity } from '../entities/world-tile-entity';

export function initializeEntities(worldContext: WorldContext) {
	console.time('Initialize Entities');

	const { worldCharacterStore, worldBuildingStore, worldItemStore, worldTileMapStore } = useWorld();

	// 현재 worldId에 해당하는 데이터만 필터링
	const characters = Object.values(get(worldCharacterStore).data).filter(
		(c) => c.world_id === worldContext.worldId
	);
	const buildings = Object.values(get(worldBuildingStore).data).filter(
		(b) => b.world_id === worldContext.worldId
	);
	const items = Object.values(get(worldItemStore).data).filter(
		(i) => i.world_id === worldContext.worldId
	);
	const worldTileMap = get(worldTileMapStore).data[worldContext.worldId];

	// 캐릭터 엔티티 생성
	console.time(`Create ${characters.length} Characters`);
	for (const character of characters) {
		try {
			const entity = new WorldCharacterEntity(worldContext, worldContext.worldId, character.id);
			entity.addToWorld();
		} catch (error) {
			console.warn('Skipping character creation:', error);
		}
	}
	console.timeEnd(`Create ${characters.length} Characters`);

	// 건물 엔티티 생성
	console.time(`Create ${buildings.length} Buildings`);
	for (const building of buildings) {
		try {
			const entity = new WorldBuildingEntity(worldContext, worldContext.worldId, building.id);
			entity.addToWorld();
		} catch (error) {
			console.warn('Skipping building creation:', error);
		}
	}
	console.timeEnd(`Create ${buildings.length} Buildings`);

	// 아이템 엔티티 생성
	console.time(`Create ${items.length} Items`);
	for (const item of items) {
		try {
			const entity = new WorldItemEntity(worldContext, worldContext.worldId, item.id);
			entity.addToWorld();
		} catch (error) {
			console.warn('Skipping item creation:', error);
		}
	}
	console.timeEnd(`Create ${items.length} Items`);

	// 타일 엔티티 생성
	const tileCount = worldTileMap ? Object.keys(worldTileMap.data).length : 0;
	console.time(`Create ${tileCount} Tiles`);
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
	console.timeEnd(`Create ${tileCount} Tiles`);

	console.timeEnd('Initialize Entities');
}

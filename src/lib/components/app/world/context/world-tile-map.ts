import { useWorld } from '$lib/hooks';
import type { WorldContext } from './world-context.svelte';
import type { TileId, WorldId, WorldTileMap, WorldTileMapInsert, TileCellKey } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { WorldTileEntity } from '../entities/world-tile-entity';

export function createWorldTileMap(
	insert: Required<Omit<WorldTileMapInsert, 'id' | 'created_at' | 'data' | 'deleted_at'>> & {
		data?: WorldTileMapInsert['data'];
	}
) {
	const { setWorldTileMap } = useWorld();

	// 클라이언트에서 UUID 생성
	const worldTileMap: WorldTileMap = {
		id: crypto.randomUUID(),
		...insert,
		data: insert.data ?? {},
		created_at: new Date().toISOString(),
		deleted_at: null,
	} as WorldTileMap;

	// 스토어 업데이트 (useWorld CRUD)
	setWorldTileMap(worldTileMap);

	return worldTileMap;
}

export function deleteWorldTileMap(worldId: WorldId) {
	const { removeWorldTileMap } = useWorld();

	// 스토어에서 제거 (useWorld CRUD)
	removeWorldTileMap(worldId);
}

export function createTilesInWorldTileMap(
	worldContext: WorldContext,
	tiles: Record<TileCellKey, TileId>
) {
	const { getWorldTileMap, addTilesToWorldTileMap } = useWorld();

	const worldTileMap = getWorldTileMap(worldContext.worldId);

	// WorldTileMap이 없으면 에러
	if (!worldTileMap) {
		throw new Error(`WorldTileMap not found for world ${worldContext.worldId}`);
	}

	// 타일 데이터 변환 후 스토어에 추가 (useWorld CRUD)
	const tileData: Record<TileCellKey, { tile_id: TileId; durability: number }> = {};
	for (const [tileCellKey, tileId] of Object.entries(tiles)) {
		tileData[tileCellKey as TileCellKey] = { tile_id: tileId, durability: 100 };
	}
	addTilesToWorldTileMap(worldContext.worldId, tileData);

	// 모든 엔티티 생성
	for (const tileCellKey of Object.keys(tiles) as TileCellKey[]) {
		const tileId = tiles[tileCellKey]!;
		const entityId = EntityIdUtils.create('tile', worldContext.worldId, tileId, tileCellKey);
		if (!worldContext.entities[entityId]) {
			try {
				const entity = new WorldTileEntity(worldContext, worldContext.worldId, tileCellKey, tileId);
				entity.addToWorld();
			} catch (error) {
				console.warn('Skipping tile creation:', error);
			}
		}
	}
}

export function deleteTileFromWorldTileMap(worldContext: WorldContext, tileCellKey: TileCellKey) {
	const { removeTileFromWorldTileMapData } = useWorld();

	// 엔티티 찾기 (tileCellKey로 instanceId가 일치하는 tile 엔티티 검색)
	const entity = Object.values(worldContext.entities).find(
		(e) => e.type === 'tile' && e.instanceId === tileCellKey
	);
	if (entity) {
		entity.removeFromWorld();
	}

	// 스토어에서 제거 (useWorld CRUD)
	removeTileFromWorldTileMapData(worldContext.worldId, tileCellKey);
}

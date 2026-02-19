import { useWorld } from '$lib/hooks';
import { produce } from 'immer';
import type { WorldContext } from './world-context.svelte';
import type { TileId, WorldId, WorldTileMap, WorldTileMapInsert, TileCellKey } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { useApp } from '$lib/hooks';
import { TEST_WORLD_ID } from '$lib/constants';
import { WorldTileEntity } from '../entities/world-tile-entity';

export async function createWorldTileMap(
	insert: Required<Omit<WorldTileMapInsert, 'id' | 'created_at' | 'data' | 'deleted_at'>> & {
		data?: WorldTileMapInsert['data'];
	}
) {
	const { worldTileMapStore, getWorldTileMap } = useWorld();
	const isTestWorld = insert.world_id === TEST_WORLD_ID;

	let worldTileMap: WorldTileMap;

	if (isTestWorld) {
		// TEST 환경: 클라이언트에서 UUID 생성
		worldTileMap = {
			id: crypto.randomUUID(),
			...insert,
			data: insert.data ?? {},
			created_at: new Date().toISOString(),
			deleted_at: null,
		} as WorldTileMap;
	} else {
		// 프로덕션 환경: 서버에 저장하고 반환된 데이터 사용
		const { supabase } = useApp();
		const { data, error } = await supabase
			.from('world_tile_maps')
			.insert(insert)
			.select()
			.single<WorldTileMap>();

		if (error || !data) {
			console.error('Failed to create world tile map:', error);
			throw error;
		}

		worldTileMap = data;
	}

	// 스토어 업데이트
	worldTileMapStore.update((state) => ({
		...state,
		data: { ...state.data, [worldTileMap.world_id]: worldTileMap },
	}));

	return worldTileMap;
}

export async function deleteWorldTileMap(worldId: WorldId) {
	const { worldTileMapStore, getWorldTileMap } = useWorld();
	const isTestWorld = worldId === TEST_WORLD_ID;

	// 프로덕션 환경이면 서버에서 soft delete
	if (!isTestWorld) {
		const { supabase } = useApp();
		const { error } = await supabase
			.from('world_tile_maps')
			.update({ deleted_at: new Date().toISOString() })
			.eq('world_id', worldId);

		if (error) {
			console.error('Failed to delete world tile map:', error);
			throw error;
		}
	}

	// 스토어 업데이트
	worldTileMapStore.update((state) => {
		const newData = { ...state.data };
		delete newData[worldId];
		return { ...state, data: newData };
	});
}

export function createTilesInWorldTileMap(
	worldContext: WorldContext,
	tiles: Record<TileCellKey, TileId>
) {
	const { worldTileMapStore, getWorldTileMap } = useWorld();

	const worldTileMap = getWorldTileMap(worldContext.worldId);

	// WorldTileMap이 없으면 에러
	if (!worldTileMap) {
		throw new Error(`WorldTileMap not found for world ${worldContext.worldId}`);
	}

	// 모든 타일을 한 번에 스토어에 추가
	worldTileMapStore.update((state) =>
		produce(state, (draft) => {
			const tileMap = draft.data[worldContext.worldId];
			if (tileMap) {
				for (const tileCellKey of Object.keys(tiles) as TileCellKey[]) {
					tileMap.data[tileCellKey] = {
						tile_id: tiles[tileCellKey]!,
						durability: 100,
					};
				}
			}
		})
	);

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
	const { worldTileMapStore, getWorldTileMap } = useWorld();

	// 엔티티 찾기 (tileCellKey로 instanceId가 일치하는 tile 엔티티 검색)
	const entity = Object.values(worldContext.entities).find(
		(e) => e.type === 'tile' && e.instanceId === tileCellKey
	);
	if (entity) {
		entity.removeFromWorld();
	}

	// 스토어 업데이트
	worldTileMapStore.update((state) =>
		produce(state, (draft) => {
			const tileMap = draft.data[worldContext.worldId];
			if (tileMap) {
				delete tileMap.data[tileCellKey];
			}
		})
	);
}

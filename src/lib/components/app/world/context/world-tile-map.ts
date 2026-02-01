import { produce } from 'immer';
import type { WorldContext } from './world-context.svelte';
import type { TileId, WorldId, WorldTileMap, WorldTileMapInsert, TileCellKey } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { useWorld } from '$lib/hooks/use-world';
import { useApp } from '$lib/hooks/use-app.svelte';
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
		const entityId = EntityIdUtils.createId('tile', worldContext.worldId, tileCellKey);
		if (!worldContext.entities[entityId]) {
			try {
				const entity = new WorldTileEntity(
					worldContext,
					worldContext.worldId,
					tileCellKey,
					tiles[tileCellKey]!
				);
				entity.addToWorld();
			} catch (error) {
				console.warn('Skipping tile creation:', error);
			}
		}
	}
}

export function deleteTileFromWorldTileMap(worldContext: WorldContext, tileCellKey: TileCellKey) {
	const { worldTileMapStore, getWorldTileMap } = useWorld();

	// 엔티티 제거
	const entityId = EntityIdUtils.createId('tile', worldContext.worldId, tileCellKey);
	const entity = worldContext.entities[entityId];
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

import { get } from 'svelte/store';
import type { WorldContext } from '../context';
import type { TileId, TileVector, WorldId, WorldTileMap, WorldTileMapInsert } from '$lib/types';
import type { Vector } from '$lib/utils/vector';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { useWorld } from '$lib/hooks/use-world';
import { WorldTileEntity } from '../entities/world-tile-entity';

export function createWorldTileMap(insert: WorldTileMapInsert) {
	const { worldTileMapStore } = useWorld();

	const worldTileMap: WorldTileMap = {
		id: crypto.randomUUID(),
		...insert,
		data: insert.data ?? {},
		created_at: new Date().toISOString(),
	} as WorldTileMap;

	// 스토어 업데이트
	worldTileMapStore.update((state) => ({
		...state,
		data: { ...state.data, [worldTileMap.world_id]: worldTileMap },
	}));

	return worldTileMap;
}

export function deleteWorldTileMap(worldId: WorldId) {
	const { worldTileMapStore } = useWorld();

	// 스토어 업데이트
	worldTileMapStore.update((state) => {
		const newData = { ...state.data };
		delete newData[worldId];
		return { ...state, data: newData };
	});
}

export function createTileInWorldTileMap(
	worldContext: WorldContext,
	tileId: TileId,
	vector: Vector
) {
	const { worldTileMapStore } = useWorld();

	const worldTileMap = get(worldTileMapStore).data[worldContext.worldId];

	// WorldTileMap이 없으면 에러
	if (!worldTileMap) {
		throw new Error(`WorldTileMap not found for world_id: ${worldContext.worldId}`);
	}

	// 타일 추가
	const tileVector: TileVector = `${vector.x},${vector.y}` as TileVector;
	worldTileMapStore.update((state) => {
		const tileMap = state.data[worldContext.worldId];
		if (tileMap) {
			return {
				...state,
				data: {
					...state.data,
					[worldContext.worldId]: {
						...tileMap,
						data: {
							...tileMap.data,
							[tileVector]: {
								tile_id: tileId,
								durability: 100,
							},
						},
					},
				},
			};
		}
		return state;
	});

	// 엔티티 생성
	const entityId = EntityIdUtils.create('tile', worldContext.worldId, tileVector);
	if (!worldContext.entities[entityId]) {
		try {
			const entity = new WorldTileEntity(worldContext, worldContext.worldId, tileVector, tileId);
			entity.addToWorld();
		} catch (error) {
			console.warn('Skipping tile creation:', error);
		}
	}
}

export function deleteTileFromWorldTileMap(worldContext: WorldContext, tileVector: TileVector) {
	const { worldTileMapStore } = useWorld();

	// 엔티티 제거
	const entityId = EntityIdUtils.create('tile', worldContext.worldId, tileVector);
	const entity = worldContext.entities[entityId];
	if (entity) {
		entity.removeFromWorld();
	}

	// 스토어 업데이트
	worldTileMapStore.update((state) => {
		const tileMap = state.data[worldContext.worldId];
		if (tileMap) {
			const newData = { ...tileMap.data };
			delete newData[tileVector];
			return {
				...state,
				data: {
					...state.data,
					[worldContext.worldId]: {
						...tileMap,
						data: newData,
					},
				},
			};
		}
		return state;
	});
}

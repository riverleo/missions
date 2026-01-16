import { get } from 'svelte/store';
import type { WorldContext } from './world-context.svelte';
import type {
	TileId,
	VectorKey,
	WorldId,
	WorldTileMap,
	WorldTileMapInsert,
	UserId,
	TerrainId,
	Vector,
} from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { useWorld } from '$lib/hooks/use-world';
import { useCurrent } from '$lib/hooks/use-current';
import { useApp } from '$lib/hooks/use-app.svelte';
import { TEST_USER_ID, TEST_WORLD_ID, TEST_PLAYER_ID, TEST_SCENARIO_ID } from '$lib/constants';
import { WorldTileEntity } from '../entities/world-tile-entity';

export async function createWorldTileMap(
	insert: Required<Omit<WorldTileMapInsert, 'id' | 'created_at' | 'data'>> & {
		data?: WorldTileMapInsert['data'];
	}
) {
	const { worldTileMapStore } = useWorld();
	const isTestWorld = insert.world_id === TEST_WORLD_ID;

	let worldTileMap: WorldTileMap;

	if (isTestWorld) {
		// TEST 환경: 클라이언트에서 UUID 생성
		worldTileMap = {
			id: crypto.randomUUID(),
			...insert,
			data: insert.data ?? {},
			created_at: new Date().toISOString(),
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
	const { worldTileMapStore } = useWorld();
	const isTestWorld = worldId === TEST_WORLD_ID;

	// 프로덕션 환경이면 서버에서 삭제
	if (!isTestWorld) {
		const { supabase } = useApp();
		const { error } = await supabase.from('world_tile_maps').delete().eq('world_id', worldId);

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

export async function createTileInWorldTileMap(
	worldContext: WorldContext,
	tileId: TileId,
	vector: Vector
) {
	const { worldTileMapStore } = useWorld();

	let worldTileMap = get(worldTileMapStore).data[worldContext.worldId];

	// WorldTileMap이 없으면 생성
	if (!worldTileMap) {
		const isTestWorld = worldContext.worldId === TEST_WORLD_ID;

		let player_id, scenario_id, user_id, terrain_id;
		if (isTestWorld) {
			player_id = TEST_PLAYER_ID;
			scenario_id = TEST_SCENARIO_ID;
			user_id = TEST_USER_ID;
			terrain_id = 'test-terrain-id' as TerrainId;
		} else {
			const player = get(useCurrent().player);
			const world = get(useWorld().worldStore).data[worldContext.worldId];
			player_id = player!.id;
			scenario_id = world!.scenario_id;
			user_id = player!.user_id;
			terrain_id = world!.terrain_id!;
		}

		worldTileMap = await createWorldTileMap({
			world_id: worldContext.worldId,
			player_id,
			scenario_id,
			user_id,
			terrain_id,
		});
	}

	// 타일 추가
	const tileVector = `${vector.x},${vector.y}` as VectorKey;
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
	const entityId = EntityIdUtils.createId('tile', worldContext.worldId, tileVector);
	if (!worldContext.entities[entityId]) {
		try {
			const entity = new WorldTileEntity(worldContext, worldContext.worldId, tileVector, tileId);
			entity.addToWorld();
		} catch (error) {
			console.warn('Skipping tile creation:', error);
		}
	}
}

export function deleteTileFromWorldTileMap(worldContext: WorldContext, tileVector: VectorKey) {
	const { worldTileMapStore } = useWorld();

	// 엔티티 제거
	const entityId = EntityIdUtils.createId('tile', worldContext.worldId, tileVector);
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

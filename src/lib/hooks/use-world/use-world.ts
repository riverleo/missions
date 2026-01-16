import { writable, get } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	World,
	WorldCharacter,
	WorldBuilding,
	WorldItem,
	WorldTileMap,
	WorldId,
	WorldCharacterId,
	WorldBuildingId,
	WorldItemId,
	EntityId,
} from '$lib/types';
import { useApp } from '$lib/hooks/use-app.svelte';
import { useCurrent } from '../use-current';

// World Store (Singleton hook)
let instance: ReturnType<typeof createWorldStore> | null = null;

function createWorldStore() {
	const { supabase } = useApp();
	let initialized = false;

	const worldStore = writable<RecordFetchState<WorldId, World>>({
		status: 'idle',
		data: {},
	});

	const worldCharacterStore = writable<RecordFetchState<WorldCharacterId, WorldCharacter>>({
		status: 'idle',
		data: {},
	});

	const worldBuildingStore = writable<RecordFetchState<WorldBuildingId, WorldBuilding>>({
		status: 'idle',
		data: {},
	});

	const worldItemStore = writable<RecordFetchState<WorldItemId, WorldItem>>({
		status: 'idle',
		data: {},
	});

	const worldTileMapStore = writable<RecordFetchState<WorldId, WorldTileMap>>({
		status: 'idle',
		data: {},
	});

	const selectedEntityIdStore = writable<{ entityId: EntityId | undefined }>({
		entityId: undefined,
	});

	function init() {
		initialized = true;
	}

	function setSelectedEntityId(entityId: EntityId | undefined) {
		selectedEntityIdStore.update((state) => ({ ...state, entityId }));
	}

	async function fetch() {
		if (!initialized) {
			throw new Error('useWorld not initialized. Call init() first.');
		}

		worldStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			// Player 조회
			const player = get(useCurrent().player);
			if (!player) return;

			// World 조회 (player_id로 필터링)
			const { data: worldData, error: worldError } = await supabase
				.from('worlds')
				.select('*')
				.eq('player_id', player.id);

			if (worldError) throw worldError;

			const worldRecord: Record<WorldId, World> = {};
			for (const world of worldData ?? []) {
				worldRecord[world.id as WorldId] = world as World;
			}

			worldStore.update((state) =>
				produce(state, (draft) => {
					draft.status = 'success';
					draft.data = worldRecord;
					draft.error = undefined;
				})
			);

			// WorldCharacter 조회 (player_id로 필터링)
			const { data: characterData, error: characterError } = await supabase
				.from('world_characters')
				.select('*')
				.eq('player_id', player.id);

			if (characterError) throw characterError;

			const characterRecord: Record<WorldCharacterId, WorldCharacter> = {};
			for (const character of characterData ?? []) {
				characterRecord[character.id as WorldCharacterId] = character as WorldCharacter;
			}

			worldCharacterStore.update((state) =>
				produce(state, (draft) => {
					draft.status = 'success';
					draft.data = characterRecord;
					draft.error = undefined;
				})
			);

			// WorldBuilding 조회 (player_id로 필터링)
			const { data: buildingData, error: buildingError } = await supabase
				.from('world_buildings')
				.select('*')
				.eq('player_id', player.id);

			if (buildingError) throw buildingError;

			const buildingRecord: Record<WorldBuildingId, WorldBuilding> = {};
			for (const building of buildingData ?? []) {
				buildingRecord[building.id as WorldBuildingId] = building as WorldBuilding;
			}

			worldBuildingStore.update((state) =>
				produce(state, (draft) => {
					draft.status = 'success';
					draft.data = buildingRecord;
					draft.error = undefined;
				})
			);

			// WorldItem 조회 (player_id로 필터링)
			const { data: itemData, error: itemError } = await supabase
				.from('world_items')
				.select('*')
				.eq('player_id', player.id);

			if (itemError) throw itemError;

			const itemRecord: Record<WorldItemId, WorldItem> = {};
			for (const item of itemData ?? []) {
				itemRecord[item.id as WorldItemId] = item as WorldItem;
			}

			worldItemStore.update((state) =>
				produce(state, (draft) => {
					draft.status = 'success';
					draft.data = itemRecord;
					draft.error = undefined;
				})
			);

			// WorldTileMap 조회 (player_id로 필터링)
			const { data: tileMapData, error: tileMapError } = await supabase
				.from('world_tile_maps')
				.select('*')
				.eq('player_id', player.id);

			if (tileMapError) throw tileMapError;

			const tileMapRecord: Record<WorldId, WorldTileMap> = {};
			for (const tileMap of tileMapData ?? []) {
				tileMapRecord[tileMap.world_id as WorldId] = tileMap as WorldTileMap;
			}

			worldTileMapStore.update((state) =>
				produce(state, (draft) => {
					draft.status = 'success';
					draft.data = tileMapRecord;
					draft.error = undefined;
				})
			);
		} catch (error) {
			console.error('Failed to fetch world:', error);
			worldStore.update((state) => ({
				...state,
				status: 'error',
				error: error instanceof Error ? error : new Error(String(error)),
			}));
		}
	}

	return {
		worldStore,
		worldCharacterStore,
		worldBuildingStore,
		worldItemStore,
		worldTileMapStore,
		selectedEntityIdStore,
		init,
		fetch,
		setSelectedEntityId,
	};
}

export function useWorld() {
	if (!instance) {
		instance = createWorldStore();
	}
	return instance;
}

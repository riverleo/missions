import { writable, get } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	World,
	WorldCharacter,
	WorldCharacterNeed,
	WorldBuilding,
	WorldBuildingCondition,
	WorldItem,
	WorldTileMap,
	WorldId,
	WorldCharacterId,
	WorldCharacterNeedId,
	WorldBuildingId,
	WorldBuildingConditionId,
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

	const worldCharacterNeedStore = writable<
		RecordFetchState<WorldCharacterNeedId, WorldCharacterNeed>
	>({
		status: 'idle',
		data: {},
	});

	const worldBuildingStore = writable<RecordFetchState<WorldBuildingId, WorldBuilding>>({
		status: 'idle',
		data: {},
	});

	const worldBuildingConditionStore = writable<
		RecordFetchState<WorldBuildingConditionId, WorldBuildingCondition>
	>({
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

	// Getter functions
	function getWorld(id: WorldId): World | undefined {
		return get(worldStore).data[id];
	}

	function getWorldCharacter(id: WorldCharacterId): WorldCharacter | undefined {
		return get(worldCharacterStore).data[id];
	}

	function getWorldCharacterNeed(id: WorldCharacterNeedId): WorldCharacterNeed | undefined {
		return get(worldCharacterNeedStore).data[id];
	}

	function getWorldBuilding(id: WorldBuildingId): WorldBuilding | undefined {
		return get(worldBuildingStore).data[id];
	}

	function getWorldBuildingCondition(
		id: WorldBuildingConditionId
	): WorldBuildingCondition | undefined {
		return get(worldBuildingConditionStore).data[id];
	}

	function getWorldItem(id: WorldItemId): WorldItem | undefined {
		return get(worldItemStore).data[id];
	}

	function getWorldTileMap(worldId: WorldId): WorldTileMap | undefined {
		return get(worldTileMapStore).data[worldId];
	}

	async function fetch() {
		if (!initialized) {
			throw new Error('useWorld not initialized. Call init() first.');
		}

		worldStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			// Player 조회
			const { playerStore } = useCurrent();
			const player = get(playerStore);
			if (!player) return;

			// 모든 데이터를 병렬로 조회
			const [
				{ data: worldData, error: worldError },
				{ data: characterData, error: characterError },
				{ data: characterNeedData, error: characterNeedError },
				{ data: buildingData, error: buildingError },
				{ data: buildingConditionData, error: buildingConditionError },
				{ data: itemData, error: itemError },
				{ data: tileMapData, error: tileMapError },
			] = await Promise.all([
				supabase.from('worlds').select('*').eq('player_id', player.id),
				supabase.from('world_characters').select('*').eq('player_id', player.id),
				supabase.from('world_character_needs').select('*').eq('player_id', player.id),
				supabase.from('world_buildings').select('*').eq('player_id', player.id),
				supabase.from('world_building_conditions').select('*').eq('player_id', player.id),
				supabase.from('world_items').select('*').eq('player_id', player.id),
				supabase.from('world_tile_maps').select('*').eq('player_id', player.id),
			]);

			if (worldError) throw worldError;
			if (characterError) throw characterError;
			if (characterNeedError) throw characterNeedError;
			if (buildingError) throw buildingError;
			if (buildingConditionError) throw buildingConditionError;
			if (itemError) throw itemError;
			if (tileMapError) throw tileMapError;

			// World 데이터 변환
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

			// WorldCharacter 데이터 변환
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

			// WorldCharacterNeed 데이터 변환
			const characterNeedRecord: Record<WorldCharacterNeedId, WorldCharacterNeed> = {};
			for (const need of characterNeedData ?? []) {
				characterNeedRecord[need.id as WorldCharacterNeedId] = need as WorldCharacterNeed;
			}

			worldCharacterNeedStore.update((state) =>
				produce(state, (draft) => {
					draft.status = 'success';
					draft.data = characterNeedRecord;
					draft.error = undefined;
				})
			);

			// WorldBuilding 데이터 변환
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

			// WorldBuildingCondition 데이터 변환
			const buildingConditionRecord: Record<
				WorldBuildingConditionId,
				WorldBuildingCondition
			> = {};
			for (const condition of buildingConditionData ?? []) {
				buildingConditionRecord[condition.id as WorldBuildingConditionId] =
					condition as WorldBuildingCondition;
			}

			worldBuildingConditionStore.update((state) =>
				produce(state, (draft) => {
					draft.status = 'success';
					draft.data = buildingConditionRecord;
					draft.error = undefined;
				})
			);

			// WorldItem 데이터 변환
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

			// WorldTileMap 데이터 변환
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
		worldCharacterNeedStore,
		worldBuildingStore,
		worldBuildingConditionStore,
		worldItemStore,
		worldTileMapStore,
		selectedEntityIdStore,
		init,
		fetch,
		setSelectedEntityId,
		getWorld,
		getWorldCharacter,
		getWorldCharacterNeed,
		getWorldBuilding,
		getWorldBuildingCondition,
		getWorldItem,
		getWorldTileMap,
	};
}

export function useWorld() {
	if (!instance) {
		instance = createWorldStore();
	}
	return instance;
}

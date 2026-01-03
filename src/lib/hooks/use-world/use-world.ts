import { writable, get } from 'svelte/store';
import { createContext } from 'svelte';
import { produce } from 'immer';
import type {
	RecordFetchState,
	World,
	WorldCharacter,
	WorldBuilding,
	WorldItem,
	WorldId,
	WorldCharacterId,
	WorldBuildingId,
	WorldItemId,
	EntityId,
} from '$lib/types';
import type { WorldContext } from '$lib/components/app/world/context';
import { useServerPayload } from '$lib/hooks/use-server-payload.svelte';
import { usePlayer } from '../use-player';

// WorldContext (Svelte context)
export const [useWorldContext, setWorldContext] = createContext<WorldContext>();

// World Store (Singleton hook)
let instance: ReturnType<typeof createWorldStore> | null = null;

function createWorldStore() {
	const { supabase } = useServerPayload();
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

	const selectedEntityStore = writable<{ entityId: EntityId | undefined }>({
		entityId: undefined,
	});

	function init() {
		initialized = true;
	}

	function setSelectedEntityId(entityId: EntityId | undefined) {
		selectedEntityStore.update((state) => ({ ...state, entityId }));
	}

	async function fetch() {
		if (!initialized) {
			throw new Error('useWorld not initialized. Call init() first.');
		}

		worldStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			// Player 조회
			const player = get(usePlayer().current);
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
		selectedEntityStore,
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

import { writable } from 'svelte/store';
import { createContext } from 'svelte';
import type {
	RecordFetchState,
	World,
	WorldCharacter,
	WorldBuilding,
	WorldId,
	WorldCharacterId,
	WorldBuildingId,
} from '$lib/types';
import type { WorldContext } from '$lib/components/app/world/context';
import { useServerPayload } from './use-server-payload.svelte';

// WorldContext (Svelte context)
export const [useWorldContext, setWorldContext] = createContext<WorldContext>();

// World Store (Singleton hook)
let instance: ReturnType<typeof createWorldStore> | null = null;

function createWorldStore() {
	const { supabase } = useServerPayload();

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

	let currentWorldId: WorldId | undefined;

	async function fetch(worldId: WorldId) {
		currentWorldId = worldId;

		worldStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			// World 조회
			const { data: worldData, error: worldError } = await supabase
				.from('worlds')
				.select('*')
				.eq('id', worldId)
				.single<World>();

			if (worldError) throw worldError;

			worldStore.set({
				status: 'success',
				data: { [worldId]: worldData },
				error: undefined,
			});

			// WorldCharacter 조회
			const { data: characterData, error: characterError } = await supabase
				.from('world_characters')
				.select('*')
				.eq('world_id', worldId);

			if (characterError) throw characterError;

			const characterRecord: Record<WorldCharacterId, WorldCharacter> = {};
			for (const character of characterData ?? []) {
				characterRecord[character.id as WorldCharacterId] = character as WorldCharacter;
			}

			worldCharacterStore.set({
				status: 'success',
				data: characterRecord,
				error: undefined,
			});

			// WorldBuilding 조회
			const { data: buildingData, error: buildingError } = await supabase
				.from('world_buildings')
				.select('*')
				.eq('world_id', worldId);

			if (buildingError) throw buildingError;

			const buildingRecord: Record<WorldBuildingId, WorldBuilding> = {};
			for (const building of buildingData ?? []) {
				buildingRecord[building.id as WorldBuildingId] = building as WorldBuilding;
			}

			worldBuildingStore.set({
				status: 'success',
				data: buildingRecord,
				error: undefined,
			});
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
		fetch,
	};
}

export function useWorld() {
	if (!instance) {
		instance = createWorldStore();
	}
	return instance;
}

import { writable, get } from 'svelte/store';
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
import { useServerPayload } from '$lib/hooks/use-server-payload.svelte';
import { usePlayer } from '../use-player';

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

	async function fetch() {
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

			worldStore.set({
				status: 'success',
				data: worldRecord,
				error: undefined,
			});

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

			worldCharacterStore.set({
				status: 'success',
				data: characterRecord,
				error: undefined,
			});

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

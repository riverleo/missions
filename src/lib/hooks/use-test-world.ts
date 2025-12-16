import { writable } from 'svelte/store';
import type { Terrain, Character, PlayerCharacter } from '$lib/types';

interface TestWorldState {
	selectedTerrain?: Terrain;
	selectedCharacter?: Character;
	characters: PlayerCharacter[];
	debug: boolean;
}

let instance: ReturnType<typeof createTestWorldStore> | null = null;

function createTestWorldStore() {
	const store = writable<TestWorldState>({
		selectedTerrain: undefined,
		selectedCharacter: undefined,
		characters: [],
		debug: false,
	});

	function selectTerrain(terrain: Terrain) {
		store.update((state) => ({
			...state,
			selectedTerrain: state.selectedTerrain?.id === terrain.id ? undefined : terrain,
		}));
	}

	function selectCharacter(character: Character) {
		store.update((state) => ({
			...state,
			selectedCharacter: state.selectedCharacter?.id === character.id ? undefined : character,
		}));
	}

	function setDebug(debug: boolean) {
		store.update((state) => ({ ...state, debug }));
	}

	function place(character: Character, x: number, y: number) {
		const playerCharacter: PlayerCharacter = {
			id: crypto.randomUUID(),
			user_id: crypto.randomUUID(),
			player_id: crypto.randomUUID(),
			character_id: character.id,
			x,
			y,
			created_at: new Date().toISOString(),
			character,
		};
		store.update((state) => ({
			...state,
			characters: [...state.characters, playerCharacter],
		}));
	}

	function removeCharacter(id: string) {
		store.update((state) => ({
			...state,
			characters: state.characters.filter((c) => c.id !== id),
		}));
	}

	function clearCharacters() {
		store.update((state) => ({
			...state,
			characters: [],
		}));
	}

	return {
		store,
		selectTerrain,
		selectCharacter,
		setDebug,
		place,
		removeCharacter,
		clearCharacters,
	};
}

export function useTestWorld() {
	if (!instance) {
		instance = createTestWorldStore();
	}
	return instance;
}

import { writable } from 'svelte/store';
import type { Terrain, Character, PlayerCharacter, Building, PlayerBuilding } from '$lib/types';

interface TestWorldState {
	selectedTerrain?: Terrain;
	selectedCharacter?: Character;
	selectedBuilding?: Building;
	characters: PlayerCharacter[];
	buildings: PlayerBuilding[];
	debug: boolean;
}

let instance: ReturnType<typeof createTestWorldStore> | null = null;

function createTestWorldStore() {
	const store = writable<TestWorldState>({
		selectedTerrain: undefined,
		selectedCharacter: undefined,
		selectedBuilding: undefined,
		characters: [],
		buildings: [],
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
			selectedBuilding: undefined, // 캐릭터 선택 시 건물 선택 해제
		}));
	}

	function selectBuilding(building: Building) {
		store.update((state) => ({
			...state,
			selectedBuilding: state.selectedBuilding?.id === building.id ? undefined : building,
			selectedCharacter: undefined, // 건물 선택 시 캐릭터 선택 해제
		}));
	}

	function setDebug(debug: boolean) {
		store.update((state) => ({ ...state, debug }));
	}

	function placeCharacter(character: Character, x: number, y: number) {
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

	function placeBuilding(building: Building, x: number, y: number) {
		const playerBuilding: PlayerBuilding = {
			id: crypto.randomUUID(),
			user_id: crypto.randomUUID(),
			player_id: crypto.randomUUID(),
			building_id: building.id,
			x,
			y,
			created_at: new Date().toISOString(),
			building,
		};
		store.update((state) => ({
			...state,
			buildings: [...state.buildings, playerBuilding],
		}));
	}

	function removeCharacter(id: string) {
		store.update((state) => ({
			...state,
			characters: state.characters.filter((c) => c.id !== id),
		}));
	}

	function removeBuilding(id: string) {
		store.update((state) => ({
			...state,
			buildings: state.buildings.filter((b) => b.id !== id),
		}));
	}

	function clearCharacters() {
		store.update((state) => ({
			...state,
			characters: [],
		}));
	}

	function clearBuildings() {
		store.update((state) => ({
			...state,
			buildings: [],
		}));
	}

	return {
		store,
		selectTerrain,
		selectCharacter,
		selectBuilding,
		setDebug,
		placeCharacter,
		placeBuilding,
		removeCharacter,
		removeBuilding,
		clearCharacters,
		clearBuildings,
	};
}

export function useTestWorld() {
	if (!instance) {
		instance = createTestWorldStore();
	}
	return instance;
}

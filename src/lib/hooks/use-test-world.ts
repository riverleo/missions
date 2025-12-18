import { writable } from 'svelte/store';
import type { Terrain, Character, WorldCharacter, Building, WorldBuilding } from '$lib/types';

interface TestWorldState {
	selectedTerrain?: Terrain;
	selectedCharacter?: Character;
	selectedBuilding?: Building;
	characters: WorldCharacter[];
	buildings: WorldBuilding[];
	// 카메라 상태: test-world-marker에서 클릭 좌표를 월드 좌표로 변환할 때 사용
	cameraX: number;
	cameraY: number;
	cameraZoom: number;
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
		cameraX: 0,
		cameraY: 0,
		cameraZoom: 1,
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

	function setCamera(x: number, y: number, zoom: number) {
		store.update((state) => ({ ...state, cameraX: x, cameraY: y, cameraZoom: zoom }));
	}

	function placeCharacter(character: Character, x: number, y: number) {
		const worldCharacter: WorldCharacter = {
			id: crypto.randomUUID(),
			user_id: crypto.randomUUID(),
			player_id: crypto.randomUUID(),
			world_id: crypto.randomUUID(),
			character_id: character.id,
			x,
			y,
			created_at: new Date().toISOString(),
			character,
		};
		store.update((state) => ({
			...state,
			characters: [...state.characters, worldCharacter],
		}));
	}

	function placeBuilding(building: Building, x: number, y: number) {
		// 픽셀 좌표를 타일 좌표로 변환
		const tile_x = Math.floor(x / 32);
		const tile_y = Math.floor(y / 32);

		const worldBuilding: WorldBuilding = {
			id: crypto.randomUUID(),
			user_id: crypto.randomUUID(),
			player_id: crypto.randomUUID(),
			world_id: crypto.randomUUID(),
			building_id: building.id,
			tile_x,
			tile_y,
			created_at: new Date().toISOString(),
			building,
		};
		store.update((state) => ({
			...state,
			buildings: [...state.buildings, worldBuilding],
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
		setCamera,
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

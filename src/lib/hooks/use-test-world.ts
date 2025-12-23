import { writable, get } from 'svelte/store';
import type { Terrain, Character, WorldCharacter, Building, WorldBuilding } from '$lib/types';
import { TILE_SIZE } from '$lib/components/app/world/constants';
import { browser } from '$app/environment';

const STORAGE_KEY = 'test-world-state';

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

const defaultState: TestWorldState = {
	selectedTerrain: undefined,
	selectedCharacter: undefined,
	selectedBuilding: undefined,
	characters: [],
	buildings: [],
	cameraX: 0,
	cameraY: 0,
	cameraZoom: 1,
	debug: false,
};

// localStorage에 저장할 필드만 정의
interface PersistedState {
	terrainId?: string;
	characters: WorldCharacter[];
	buildings: WorldBuilding[];
	debug: boolean;
}

function loadFromStorage(): { state: TestWorldState; terrainId?: string } {
	if (!browser) return { state: defaultState };
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			const persisted: PersistedState = JSON.parse(saved);
			return {
				state: {
					...defaultState,
					characters: persisted.characters ?? [],
					buildings: persisted.buildings ?? [],
					debug: persisted.debug ?? false,
				},
				terrainId: persisted.terrainId,
			};
		}
	} catch {
		// ignore parse errors
	}
	return { state: defaultState };
}

function saveToStorage(state: TestWorldState) {
	if (!browser) return;
	try {
		const persisted: PersistedState = {
			terrainId: state.selectedTerrain?.id,
			characters: state.characters,
			buildings: state.buildings,
			debug: state.debug,
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
	} catch {
		// ignore storage errors
	}
}

let instance: ReturnType<typeof createTestWorldStore> | null = null;
let pendingTerrainId: string | undefined;

function createTestWorldStore() {
	const { state, terrainId } = loadFromStorage();
	pendingTerrainId = terrainId;

	const store = writable<TestWorldState>(state);

	// 1초마다 localStorage에 저장
	if (browser) {
		setInterval(() => saveToStorage(get(store)), 1000);
	}

	// 저장된 terrain ID로 terrain 복원 (terrain store에서 찾아서 설정)
	function restoreTerrain(terrainStore: Record<string, Terrain>) {
		if (pendingTerrainId && terrainStore[pendingTerrainId]) {
			store.update((s) => ({ ...s, selectedTerrain: terrainStore[pendingTerrainId!] }));
			pendingTerrainId = undefined;
		}
	}

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
		const tile_x = Math.floor(x / TILE_SIZE);
		const tile_y = Math.floor(y / TILE_SIZE);

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

	// World의 body 위치를 스토어에 동기화
	function syncPositions(
		characterBodies: Record<string, { position: { x: number; y: number } }>,
		buildingBodies: Record<string, { position: { x: number; y: number } }>
	) {
		store.update((state) => ({
			...state,
			characters: state.characters.map((c) => {
				const body = characterBodies[c.id];
				return body ? { ...c, x: body.position.x, y: body.position.y } : c;
			}),
			buildings: state.buildings.map((b) => {
				const body = buildingBodies[b.id];
				// 건물은 tile_x, tile_y로 저장 (픽셀 좌표를 타일 좌표로 변환)
				if (body) {
					const tile_x = Math.floor(body.position.x / TILE_SIZE);
					const tile_y = Math.floor(body.position.y / TILE_SIZE);
					return { ...b, tile_x, tile_y };
				}
				return b;
			}),
		}));
	}

	return {
		store,
		restoreTerrain,
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
		syncPositions,
	};
}

export function useTestWorld() {
	if (!instance) {
		instance = createTestWorldStore();
	}
	return instance;
}

import { writable, get } from 'svelte/store';
import type {
	RecordFetchState,
	Terrain,
	Character,
	World,
	WorldCharacter,
	Building,
	WorldBuilding,
	WorldCharacterId,
	WorldBuildingId,
	WorldId,
	PlayerId,
} from '$lib/types';
import { TILE_SIZE } from '$lib/components/app/world/constants';
import { browser } from '$app/environment';
import { useWorld } from './use-world';

const STORAGE_KEY = 'test-world-state';
const TEST_PLAYER_ID = 'test-player-id' as PlayerId;

interface WorldTestStoreState {
	open: boolean;
	selectedTerrain?: Terrain;
	selectedCharacter?: Character;
	selectedBuilding?: Building;
	worlds: Record<WorldId, World>;
	worldCharacters: Record<WorldCharacterId, WorldCharacter>;
	worldBuildings: Record<WorldBuildingId, WorldBuilding>;
	// 카메라 상태: test-world-marker에서 클릭 좌표를 월드 좌표로 변환할 때 사용
	cameraX: number;
	cameraY: number;
	cameraZoom: number;
	// 모달 위치 (픽셀 단위)
	modalX: number;
	modalY: number;
	debug: boolean;
	eraser: boolean;
}

const defaultState: WorldTestStoreState = {
	open: false,
	selectedTerrain: undefined,
	selectedCharacter: undefined,
	selectedBuilding: undefined,
	worlds: {},
	worldCharacters: {},
	worldBuildings: {},
	cameraX: 0,
	cameraY: 0,
	cameraZoom: 1,
	modalX: 0,
	modalY: 0,
	debug: false,
	eraser: false,
};

// localStorage에 저장할 필드만 정의
interface PersistedState {
	terrainId?: string;
	worldCharacters: Record<WorldCharacterId, WorldCharacter>;
	worldBuildings: Record<WorldBuildingId, WorldBuilding>;
	modalX: number;
	modalY: number;
	debug: boolean;
}

function loadFromStorage(): { state: WorldTestStoreState; terrainId?: string } {
	if (!browser) return { state: defaultState };
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			const persisted: PersistedState = JSON.parse(saved);
			return {
				state: {
					...defaultState,
					worldCharacters: persisted.worldCharacters ?? {},
					worldBuildings: persisted.worldBuildings ?? {},
					modalX: persisted.modalX ?? 0,
					modalY: persisted.modalY ?? 0,
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

function saveToStorage(state: WorldTestStoreState) {
	if (!browser) return;
	try {
		const persisted: PersistedState = {
			terrainId: state.selectedTerrain?.id,
			worldCharacters: state.worldCharacters,
			worldBuildings: state.worldBuildings,
			modalX: state.modalX,
			modalY: state.modalY,
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

	const store = writable<WorldTestStoreState>(state);

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
			selectedBuilding: undefined,
			eraser: false,
		}));
	}

	function selectBuilding(building: Building) {
		store.update((state) => ({
			...state,
			selectedBuilding: state.selectedBuilding?.id === building.id ? undefined : building,
			selectedCharacter: undefined,
			eraser: false,
		}));
	}

	function setDebug(debug: boolean) {
		store.update((state) => ({ ...state, debug }));
	}

	function setEraser(eraser: boolean) {
		store.update((state) => ({
			...state,
			eraser,
			selectedCharacter: undefined,
			selectedBuilding: undefined,
		}));
	}

	function setOpen(open: boolean) {
		store.update((state) => ({ ...state, open }));
	}

	function toggleOpen() {
		store.update((state) => ({ ...state, open: !state.open }));
	}

	function setCamera(x: number, y: number, zoom: number) {
		store.update((state) => ({ ...state, cameraX: x, cameraY: y, cameraZoom: zoom }));
	}

	function setModalPosition(x: number, y: number) {
		store.update((state) => ({ ...state, modalX: x, modalY: y }));
	}

	function placeCharacter(character: Character, x: number, y: number) {
		const worldCharacter: WorldCharacter = {
			id: crypto.randomUUID() as WorldCharacterId,
			user_id: crypto.randomUUID(),
			player_id: TEST_PLAYER_ID,
			world_id: crypto.randomUUID() as WorldId,
			character_id: character.id,
			x,
			y,
			created_at: new Date().toISOString(),
		} as WorldCharacter;
		store.update((state) => ({
			...state,
			worldCharacters: {
				...state.worldCharacters,
				[worldCharacter.id]: worldCharacter,
			},
		}));
	}

	function placeBuilding(building: Building, x: number, y: number) {
		// 픽셀 좌표를 타일 좌표로 변환
		const tile_x = Math.floor(x / TILE_SIZE);
		const tile_y = Math.floor(y / TILE_SIZE);

		const worldBuilding: WorldBuilding = {
			id: crypto.randomUUID() as WorldBuildingId,
			user_id: crypto.randomUUID(),
			player_id: TEST_PLAYER_ID,
			world_id: crypto.randomUUID() as WorldId,
			building_id: building.id,
			tile_x,
			tile_y,
			created_at: new Date().toISOString(),
		} as WorldBuilding;
		store.update((state) => ({
			...state,
			worldBuildings: {
				...state.worldBuildings,
				[worldBuilding.id]: worldBuilding,
			},
		}));
	}

	function removeCharacter(id: string) {
		store.update((state) => {
			const newData = { ...state.worldCharacters };
			delete newData[id as WorldCharacterId];
			return {
				...state,
				worldCharacters: newData,
			};
		});
	}

	function removeBuilding(id: string) {
		store.update((state) => {
			const newData = { ...state.worldBuildings };
			delete newData[id as WorldBuildingId];
			return {
				...state,
				worldBuildings: newData,
			};
		});
	}

	function clearCharacters() {
		store.update((state) => ({
			...state,
			worldCharacters: {},
		}));
	}

	function clearBuildings() {
		store.update((state) => ({
			...state,
			worldBuildings: {},
		}));
	}

	// World의 body 위치를 스토어에 동기화
	function syncPositions(
		worldCharacterEntities: Record<string, { body: { position: { x: number; y: number } } }>,
		buildingBodies: Record<string, { body: { position: { x: number; y: number } } }>
	) {
		store.update((state) => {
			const updatedCharacters: Record<WorldCharacterId, WorldCharacter> = {};
			for (const id in state.worldCharacters) {
				const char = state.worldCharacters[id as WorldCharacterId];
				if (!char) continue;

				const body = worldCharacterEntities[id];
				if (body) {
					updatedCharacters[id as WorldCharacterId] = {
						...char,
						x: body.body.position.x,
						y: body.body.position.y,
					};
				} else {
					updatedCharacters[id as WorldCharacterId] = char;
				}
			}

			const updatedBuildings: Record<WorldBuildingId, WorldBuilding> = {};
			for (const id in state.worldBuildings) {
				const building = state.worldBuildings[id as WorldBuildingId];
				if (!building) continue;

				const body = buildingBodies[id];
				if (body) {
					const tile_x = Math.floor(body.body.position.x / TILE_SIZE);
					const tile_y = Math.floor(body.body.position.y / TILE_SIZE);
					updatedBuildings[id as WorldBuildingId] = {
						...building,
						tile_x,
						tile_y,
					};
				} else {
					updatedBuildings[id as WorldBuildingId] = building;
				}
			}

			return {
				...state,
				worldCharacters: updatedCharacters,
				worldBuildings: updatedBuildings,
			};
		});
	}

	function init() {
		const world = useWorld();
		const testState = get(store);

		// use-world 스토어에 테스트 데이터 주입
		world.worldStore.set({
			status: 'success',
			data: testState.worlds,
		});
		world.worldCharacterStore.set({
			status: 'success',
			data: testState.worldCharacters,
		});
		world.worldBuildingStore.set({
			status: 'success',
			data: testState.worldBuildings,
		});
	}

	return {
		store,
		restoreTerrain,
		selectTerrain,
		selectCharacter,
		selectBuilding,
		setDebug,
		setEraser,
		setOpen,
		toggleOpen,
		setCamera,
		setModalPosition,
		placeCharacter,
		placeBuilding,
		removeCharacter,
		removeBuilding,
		clearCharacters,
		clearBuildings,
		syncPositions,
		init,
		TEST_PLAYER_ID,
	};
}

export function useTestWorld() {
	if (!instance) {
		instance = createTestWorldStore();
	}
	return instance;
}

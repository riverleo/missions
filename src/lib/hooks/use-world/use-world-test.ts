import { writable, get } from 'svelte/store';
import type {
	World,
	WorldCharacter,
	WorldBuilding,
	WorldCharacterId,
	WorldBuildingId,
	WorldId,
	PlayerId,
	ScenarioId,
	TerrainId,
	CharacterId,
	BuildingId,
} from '$lib/types';
import { TILE_SIZE } from '$lib/components/app/world/constants';
import { browser } from '$app/environment';
import { useWorld } from './use-world';
import { useTerrain } from '../use-terrain';

const STORAGE_KEY = 'test-world-state';

export const TEST_PLAYER_ID = 'test-player-id' as PlayerId;
export const TEST_SCENARIO_ID = 'test-scenario-id' as ScenarioId;
export const TEST_WORLD_ID = 'test-world-id' as WorldId;

interface WorldTestStoreState {
	open: boolean;
	selectedTerrainId?: TerrainId;
	selectedCharacterId?: CharacterId;
	selectedBuildingId?: BuildingId;
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
	selectedTerrainId: undefined,
	selectedCharacterId: undefined,
	selectedBuildingId: undefined,
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
	worlds: Record<WorldId, World>;
	worldCharacters: Record<WorldCharacterId, WorldCharacter>;
	worldBuildings: Record<WorldBuildingId, WorldBuilding>;
	modalX: number;
	modalY: number;
	debug: boolean;
}

function loadFromStorage(): WorldTestStoreState {
	if (!browser) return defaultState;
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			const persisted: PersistedState = JSON.parse(saved);
			// worlds에서 terrain ID 찾아 selectedTerrainId 설정
			const world = persisted.worlds?.[TEST_WORLD_ID];
			return {
				...defaultState,
				selectedTerrainId: world?.terrain?.id,
				worlds: persisted.worlds ?? {},
				worldCharacters: persisted.worldCharacters ?? {},
				worldBuildings: persisted.worldBuildings ?? {},
				modalX: persisted.modalX ?? 0,
				modalY: persisted.modalY ?? 0,
				debug: persisted.debug ?? false,
			};
		}
	} catch {
		// ignore parse errors
	}
	return defaultState;
}

function saveToStorage(state: WorldTestStoreState) {
	if (!browser) return;
	try {
		// TEST_WORLD_ID와 관련된 데이터만 필터링
		const testWorld = state.worlds[TEST_WORLD_ID];
		const testWorldCharacters: Record<WorldCharacterId, WorldCharacter> = {};
		const testWorldBuildings: Record<WorldBuildingId, WorldBuilding> = {};

		for (const [id, character] of Object.entries(state.worldCharacters)) {
			if (character.world_id === TEST_WORLD_ID) {
				testWorldCharacters[id as WorldCharacterId] = character;
			}
		}

		for (const [id, building] of Object.entries(state.worldBuildings)) {
			if (building.world_id === TEST_WORLD_ID) {
				testWorldBuildings[id as WorldBuildingId] = building;
			}
		}

		const persisted: PersistedState = {
			worlds: testWorld ? { [TEST_WORLD_ID]: testWorld } : {},
			worldCharacters: testWorldCharacters,
			worldBuildings: testWorldBuildings,
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

function createTestWorldStore() {
	const state = loadFromStorage();

	const store = writable<WorldTestStoreState>(state);

	// 1초마다 localStorage에 저장
	if (browser) {
		setInterval(() => saveToStorage(get(store)), 1000);
	}

	function selectTerrain(terrainId: TerrainId) {
		store.update((state) => {
			const isSameTerrain = state.selectedTerrainId === terrainId;

			// 같은 terrain 선택 시 선택 해제 및 world 제거
			if (isSameTerrain) {
				const newWorlds = { ...state.worlds };
				delete newWorlds[TEST_WORLD_ID];
				return {
					...state,
					selectedTerrainId: undefined,
					worlds: newWorlds,
				};
			}

			// 새 terrain 선택 시 world 생성 또는 업데이트
			const terrain = get(useTerrain().store).data[terrainId];
			if (!terrain) return state;

			const world: World = {
				id: TEST_WORLD_ID,
				user_id: crypto.randomUUID(),
				player_id: TEST_PLAYER_ID,
				scenario_id: TEST_SCENARIO_ID,
				terrain: terrain,
				name: 'Test World',
				created_at: new Date().toISOString(),
			} as World;

			return {
				...state,
				selectedTerrainId: terrainId,
				worlds: {
					...state.worlds,
					[TEST_WORLD_ID]: world,
				},
			};
		});
	}

	function selectCharacter(characterId: CharacterId) {
		store.update((state) => ({
			...state,
			selectedCharacterId: state.selectedCharacterId === characterId ? undefined : characterId,
			selectedBuildingId: undefined,
			eraser: false,
		}));
	}

	function selectBuilding(buildingId: BuildingId) {
		store.update((state) => ({
			...state,
			selectedBuildingId: state.selectedBuildingId === buildingId ? undefined : buildingId,
			selectedCharacterId: undefined,
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
			selectedCharacterId: undefined,
			selectedBuildingId: undefined,
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

	function addWorldCharacter(characterId: CharacterId, x: number, y: number) {
		const worldCharacter: WorldCharacter = {
			id: crypto.randomUUID() as WorldCharacterId,
			user_id: crypto.randomUUID(),
			player_id: TEST_PLAYER_ID,
			scenario_id: TEST_SCENARIO_ID,
			world_id: TEST_WORLD_ID,
			character_id: characterId,
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

	function addWorldBuilding(buildingId: BuildingId, x: number, y: number) {
		// 픽셀 좌표를 타일 좌표로 변환
		const tile_x = Math.floor(x / TILE_SIZE);
		const tile_y = Math.floor(y / TILE_SIZE);

		const worldBuilding: WorldBuilding = {
			id: crypto.randomUUID() as WorldBuildingId,
			user_id: crypto.randomUUID(),
			player_id: TEST_PLAYER_ID,
			scenario_id: TEST_SCENARIO_ID,
			world_id: TEST_WORLD_ID,
			building_id: buildingId,
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

	function removeWorldCharacter(worldCharacterId: WorldCharacterId) {
		store.update((state) => {
			const newData = { ...state.worldCharacters };
			delete newData[worldCharacterId];
			return {
				...state,
				worldCharacters: newData,
			};
		});
	}

	function removeWorldBuilding(worldBuildingId: WorldBuildingId) {
		store.update((state) => {
			const newData = { ...state.worldBuildings };
			delete newData[worldBuildingId];
			return {
				...state,
				worldBuildings: newData,
			};
		});
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
		selectTerrain,
		selectCharacter,
		selectBuilding,
		setDebug,
		setEraser,
		setOpen,
		toggleOpen,
		setCamera,
		setModalPosition,
		addWorldCharacter,
		addWorldBuilding,
		removeWorldCharacter,
		removeWorldBuilding,
		syncPositions,
		init,
	};
}

export function useWorldTest() {
	if (!instance) {
		instance = createTestWorldStore();
	}
	return instance;
}

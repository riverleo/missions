import { writable, get } from 'svelte/store';
import { produce } from 'immer';
import type {
	World,
	WorldCharacter,
	WorldBuilding,
	WorldCharacterId,
	WorldBuildingId,
	WorldId,
	UserId,
	PlayerId,
	ScenarioId,
	TerrainId,
	CharacterId,
	BuildingId,
} from '$lib/types';
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
	modalX: 0,
	modalY: 0,
	debug: false,
	eraser: false,
};

// localStorage 저장 포맷 (WorldTestStoreState + world 데이터)
interface StoredState extends WorldTestStoreState {
	worlds?: Record<WorldId, World>;
	worldCharacters?: Record<WorldCharacterId, WorldCharacter>;
	worldBuildings?: Record<WorldBuildingId, WorldBuilding>;
}

function loadFromStorage(): StoredState {
	if (!browser) return defaultState;
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			const stored: StoredState = JSON.parse(saved);
			// worlds에서 terrain ID 찾아 selectedTerrainId 설정
			const world = stored.worlds?.[TEST_WORLD_ID];
			return {
				open: stored.open ?? defaultState.open,
				selectedTerrainId: world?.terrain_id ?? undefined,
				selectedCharacterId: stored.selectedCharacterId,
				selectedBuildingId: stored.selectedBuildingId,
				modalX: stored.modalX ?? defaultState.modalX,
				modalY: stored.modalY ?? defaultState.modalY,
				debug: stored.debug ?? defaultState.debug,
				eraser: stored.eraser ?? defaultState.eraser,
				worlds: stored.worlds,
				worldCharacters: stored.worldCharacters,
				worldBuildings: stored.worldBuildings,
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
		// useWorld 스토어에서 TEST_WORLD_ID와 관련된 데이터만 필터링
		const world = useWorld();
		const worlds = get(world.worldStore).data;
		const worldCharacters = get(world.worldCharacterStore).data;
		const worldBuildings = get(world.worldBuildingStore).data;

		const testWorld = worlds[TEST_WORLD_ID];
		const testWorldCharacters: Record<WorldCharacterId, WorldCharacter> = {};
		const testWorldBuildings: Record<WorldBuildingId, WorldBuilding> = {};

		for (const [id, character] of Object.entries(worldCharacters)) {
			if (character.world_id === TEST_WORLD_ID) {
				testWorldCharacters[id as WorldCharacterId] = character;
			}
		}

		for (const [id, building] of Object.entries(worldBuildings)) {
			if (building.world_id === TEST_WORLD_ID) {
				testWorldBuildings[id as WorldBuildingId] = building;
			}
		}

		const stored: StoredState = {
			...state,
			worlds: testWorld ? { [TEST_WORLD_ID]: testWorld } : {},
			worldCharacters: testWorldCharacters,
			worldBuildings: testWorldBuildings,
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
	} catch {
		// ignore storage errors
	}
}

let instance: ReturnType<typeof createTestWorldStore> | null = null;

function createTestWorldStore() {
	const stored = loadFromStorage();

	const store = writable<WorldTestStoreState>({
		open: stored.open,
		selectedTerrainId: stored.selectedTerrainId,
		selectedCharacterId: stored.selectedCharacterId,
		selectedBuildingId: stored.selectedBuildingId,
		modalX: stored.modalX,
		modalY: stored.modalY,
		debug: stored.debug,
		eraser: stored.eraser,
	});

	// 1초마다 localStorage에 저장
	if (browser) {
		setInterval(() => saveToStorage(get(store)), 1000);
	}

	function selectTerrain(terrainId: TerrainId) {
		store.update((state) => {
			const isSameTerrain = state.selectedTerrainId === terrainId;

			// 같은 terrain 선택 시 선택 해제 및 world 제거
			if (isSameTerrain) {
				// use-world 스토어 업데이트
				const world = useWorld();
				world.worldStore.update((state) =>
					produce(state, (draft) => {
						delete draft.data[TEST_WORLD_ID];
					})
				);

				return {
					...state,
					selectedTerrainId: undefined,
				};
			}

			// 새 terrain 선택 시 world 생성 또는 업데이트
			const terrain = get(useTerrain().store).data[terrainId];
			if (!terrain) return state;

			const newWorld: World = {
				id: TEST_WORLD_ID,
				user_id: crypto.randomUUID() as UserId,
				player_id: TEST_PLAYER_ID,
				scenario_id: TEST_SCENARIO_ID,
				terrain_id: terrain.id,
				name: 'Test World',
				created_at: new Date().toISOString(),
			} as World;

			// use-world 스토어 업데이트
			const world = useWorld();
			world.worldStore.update((state) =>
				produce(state, (draft) => {
					draft.data[TEST_WORLD_ID] = newWorld;
				})
			);

			return {
				...state,
				selectedTerrainId: terrainId,
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

		// use-world 스토어 업데이트
		const world = useWorld();
		world.worldCharacterStore.update((state) =>
			produce(state, (draft) => {
				draft.data[worldCharacter.id] = worldCharacter;
			})
		);
	}

	function addWorldBuilding(buildingId: BuildingId, tileX: number, tileY: number) {
		const worldBuilding: WorldBuilding = {
			id: crypto.randomUUID() as WorldBuildingId,
			user_id: crypto.randomUUID() as UserId,
			player_id: TEST_PLAYER_ID,
			scenario_id: TEST_SCENARIO_ID,
			world_id: TEST_WORLD_ID,
			building_id: buildingId,
			tile_x: tileX,
			tile_y: tileY,
			created_at: new Date().toISOString(),
			created_at_tick: 0,
		} as WorldBuilding;

		// use-world 스토어 업데이트
		const world = useWorld();
		world.worldBuildingStore.update((state) =>
			produce(state, (draft) => {
				draft.data[worldBuilding.id] = worldBuilding;
			})
		);
	}

	function removeWorldCharacter(worldCharacterId: WorldCharacterId) {
		// use-world 스토어 업데이트
		const world = useWorld();
		world.worldCharacterStore.update((state) =>
			produce(state, (draft) => {
				delete draft.data[worldCharacterId];
			})
		);
	}

	function removeWorldBuilding(worldBuildingId: WorldBuildingId) {
		// use-world 스토어 업데이트
		const world = useWorld();
		world.worldBuildingStore.update((state) =>
			produce(state, (draft) => {
				delete draft.data[worldBuildingId];
			})
		);
	}

	function init() {
		// localStorage에서 world 데이터 로드하여 use-world 스토어에 추가
		const world = useWorld();

		if (stored.worlds) {
			world.worldStore.update((state) =>
				produce(state, (draft) => {
					Object.assign(draft.data, stored.worlds);
					draft.status = 'success';
				})
			);
		}

		if (stored.worldCharacters) {
			world.worldCharacterStore.update((state) =>
				produce(state, (draft) => {
					Object.assign(draft.data, stored.worldCharacters);
					draft.status = 'success';
				})
			);
		}

		if (stored.worldBuildings) {
			world.worldBuildingStore.update((state) =>
				produce(state, (draft) => {
					Object.assign(draft.data, stored.worldBuildings);
					draft.status = 'success';
				})
			);
		}
	}

	return {
		store,
		selectTerrain,
		selectCharacter,
		selectBuilding,
		setDebug,
		setEraser,
		setOpen,
		setModalPosition,
		addWorldCharacter,
		addWorldBuilding,
		removeWorldCharacter,
		removeWorldBuilding,
		init,
	};
}

export function useWorldTest() {
	if (!instance) {
		instance = createTestWorldStore();
	}
	return instance;
}

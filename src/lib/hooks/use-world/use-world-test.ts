import { writable, get } from 'svelte/store';
import { produce } from 'immer';
import type {
	World,
	WorldCharacter,
	WorldBuilding,
	WorldItem,
	WorldCharacterId,
	WorldBuildingId,
	WorldItemId,
	WorldId,
	UserId,
	PlayerId,
	ScenarioId,
	TerrainId,
	CharacterId,
	BuildingId,
	ItemId,
} from '$lib/types';
import { browser } from '$app/environment';
import { useWorld } from './use-world';
import { useTerrain } from '../use-terrain';
import { loadFromStorage, saveToStorage, type WorldTestStoreState } from './use-world-test-storage';

export const TEST_PLAYER_ID = 'test-player-id' as PlayerId;
export const TEST_SCENARIO_ID = 'test-scenario-id' as ScenarioId;
export const TEST_WORLD_ID = 'test-world-id' as WorldId;

let instance: ReturnType<typeof createTestWorldStore> | null = null;

function createTestWorldStore() {
	const stored = loadFromStorage();

	const store = writable<WorldTestStoreState>(stored);

	// 5초마다 localStorage에 저장
	if (browser) {
		setInterval(() => saveToStorage(get(store)), 5000);
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
			selectedItemId: undefined,
			eraser: false,
		}));
	}

	function selectBuilding(buildingId: BuildingId) {
		store.update((state) => ({
			...state,
			selectedBuildingId: state.selectedBuildingId === buildingId ? undefined : buildingId,
			selectedCharacterId: undefined,
			selectedItemId: undefined,
			eraser: false,
		}));
	}

	function selectItem(itemId: ItemId) {
		store.update((state) => ({
			...state,
			selectedItemId: state.selectedItemId === itemId ? undefined : itemId,
			selectedCharacterId: undefined,
			selectedBuildingId: undefined,
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
			selectedItemId: undefined,
		}));
	}

	function setOpen(open: boolean) {
		store.update((state) => ({ ...state, open }));
	}

	function setModalPosition(x: number, y: number) {
		store.update((state) => ({ ...state, modalX: x, modalY: y }));
	}

	function setPanelsOpen(open: boolean) {
		store.update((state) => ({ ...state, commandPanelOpen: open, inspectorPanelOpen: open }));
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

	function addWorldItem(itemId: ItemId, x: number, y: number, rotation: number = 0) {
		const worldItem: WorldItem = {
			id: crypto.randomUUID() as WorldItemId,
			user_id: crypto.randomUUID() as UserId,
			player_id: TEST_PLAYER_ID,
			scenario_id: TEST_SCENARIO_ID,
			world_id: TEST_WORLD_ID,
			item_id: itemId,
			x,
			y,
			rotation,
			created_at: new Date().toISOString(),
			created_at_tick: 0,
		} as WorldItem;

		// use-world 스토어 업데이트
		const world = useWorld();
		world.worldItemStore.update((state) =>
			produce(state, (draft) => {
				draft.data[worldItem.id] = worldItem;
			})
		);
	}

	function removeWorldItem(worldItemId: WorldItemId) {
		// use-world 스토어 업데이트
		const world = useWorld();
		world.worldItemStore.update((state) =>
			produce(state, (draft) => {
				delete draft.data[worldItemId];
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

		if (stored.worldItems) {
			world.worldItemStore.update((state) =>
				produce(state, (draft) => {
					Object.assign(draft.data, stored.worldItems);
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
		selectItem,
		setDebug,
		setEraser,
		setOpen,
		setModalPosition,
		setPanelsOpen,
		addWorldCharacter,
		addWorldBuilding,
		addWorldItem,
		removeWorldCharacter,
		removeWorldBuilding,
		removeWorldItem,
		init,
	};
}

export function useWorldTest() {
	if (!instance) {
		instance = createTestWorldStore();
	}
	return instance;
}

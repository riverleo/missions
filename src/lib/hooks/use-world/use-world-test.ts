import { writable, get } from 'svelte/store';
import { produce } from 'immer';
import type { TerrainId, ScreenVector } from '$lib/types';
import type { StoredState } from '$lib/types/hooks';
import { browser } from '$app/environment';
import { useWorld } from './use-world';
import { usePlayer } from '../use-player';
import { useTerrain } from '../use-terrain';
import { load, save } from './use-world-test-storage';
import { createWorld, deleteWorld } from '$lib/components/app/world/context/world';
import { TEST_WORLD_ID } from '$lib/constants';

let instance: ReturnType<typeof createTestWorldStore> | undefined;

function createTestWorldStore() {
	const stored = load();

	const store = writable<StoredState>(stored);

	// 5초마다 localStorage에 저장
	if (browser) {
		setInterval(() => save(get(store)), 5000);
	}

	function setSelectedTerrainId(terrainId: TerrainId) {
		const { terrainStore } = useTerrain();

		store.update((state) => {
			const isSameTerrain = state.selectedTerrainId === terrainId;

			// 같은 terrain 선택 시 선택 해제 및 world, worldTileMap 제거
			if (isSameTerrain) {
				// world 제거 (worldTileMap도 자동 제거됨)
				deleteWorld(TEST_WORLD_ID);

				return {
					...state,
					selectedTerrainId: undefined,
				};
			}

			// 새 terrain 선택 시 world 생성 또는 업데이트
			const terrain = get(terrainStore).data[terrainId];
			if (!terrain) return state;

			// world 생성 (worldTileMap 자동 생성됨)
			createWorld({
				id: TEST_WORLD_ID,
				terrain_id: terrain.id,
				name: 'Test World',
			});

			return {
				...state,
				selectedTerrainId: terrainId,
			};
		});
	}

	function setDebug(debug: boolean) {
		store.update((state) => ({ ...state, debug }));
	}

	function setOpen(open: boolean) {
		store.update((state) => ({ ...state, open }));
	}

	function setModalScreenVector(screenVector: ScreenVector) {
		store.update((state) => ({ ...state, modalScreenVector: screenVector }));
	}

	function setOpenPanel(open: boolean) {
		store.update((state) => ({ ...state, openPanel: open }));
	}

	function init() {
		// localStorage에서 world 데이터 로드하여 use-world 스토어에 추가
		const world = useWorld();
		const player = usePlayer();

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

		if (stored.worldTileMaps) {
			world.worldTileMapStore.update((state) =>
				produce(state, (draft) => {
					Object.assign(draft.data, stored.worldTileMaps);
					draft.status = 'success';
				})
			);
		}

		// Player 로드
		player.playerStore.update((state) =>
			produce(state, (draft) => {
				draft.data[stored.player.id] = stored.player;
				draft.status = 'success';
			})
		);

		// PlayerScenario 로드 (current_tick이 저장된 tick 값으로 업데이트되어 있음)
		player.playerScenarioStore.update((state) =>
			produce(state, (draft) => {
				draft.data[stored.playerScenario.id] = stored.playerScenario;
				draft.status = 'success';
			})
		);
	}

	return {
		store,
		setSelectedTerrainId,
		setDebug,
		setOpen,
		setModalScreenVector,
		setOpenPanel,
		init,
	};
}

export function useWorldTest() {
	if (!instance) {
		instance = createTestWorldStore();
	}
	return instance;
}

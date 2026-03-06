import { writable, get } from 'svelte/store';
import { produce } from 'immer';
import { browser } from '$app/environment';
import type { TerrainId, ScreenVector, World, WorldId } from '$lib/types';
import type { WorldContext } from '$lib/components/app/world/context';
import type { TestWorldSnapshot } from '$lib/types/hooks';
import { useWorld } from './use-world';
import { usePlayer } from '../use-player';
import { useTerrain } from '../use-terrain';
import { load, save, defaultState } from './use-world-test-storage';
import { deleteWorld } from '$lib/components/app/world/context/world';
import { TEST_PLAYER_ID, TEST_WORLD_ID, TEST_WORLD_SNAPSHOT_KEY } from '$lib/constants';
import { useCurrent } from '../use-current';

let instance: ReturnType<typeof createTestWorldStore> | undefined;

function createTestWorldStore() {
	const stored = load();

	const store = writable<TestWorldSnapshot>(stored);

	/**
	 * 테스트 플레이어/시나리오가 useCurrent 컨텍스트에 있는지 보장한다.
	 */
	function ensureContext() {
		const player = usePlayer();
		const { selectPlayer } = useCurrent();
		const playerData = stored.player;
		const scenarioData = stored.playerScenario;

		player.playerStore.update((state) =>
			produce(state, (draft) => {
				draft.data[playerData.id] = playerData;
				draft.status = 'success';
			})
		);

		player.playerScenarioStore.update((state) =>
			produce(state, (draft) => {
				draft.data[scenarioData.id] = scenarioData;
				draft.status = 'success';
			})
		);

		selectPlayer(playerData.id);
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

			// context를 직접 전달하여 requireCurrentContext() 의존 제거
			useWorld().createWorld({
				id: TEST_WORLD_ID,
				terrain_id: terrain.id,
				name: 'Test World',
				user_id: stored.player.user_id,
				player_id: stored.player.id,
				scenario_id: stored.playerScenario.scenario_id,
			});

			return {
				...state,
				selectedTerrainId: terrainId,
			};
		});
	}

	function setDebug(debug: boolean) {
		store.update((state) => {
			const newState = { ...state, debug };
			save(newState);
			return newState;
		});
	}

	function setOpen(open: boolean) {
		store.update((state) => {
			const newState = { ...state, open };
			save(newState);
			return newState;
		});
	}

	function setModalScreenVector(screenVector: ScreenVector) {
		store.update((state) => {
			const newState = { ...state, modalScreenVector: screenVector };
			save(newState);
			return newState;
		});
	}

	function setOpenPanel(open: boolean) {
		store.update((state) => {
			const newState = { ...state, openPanel: open };
			save(newState);
			return newState;
		});
	}

	async function reset(worldContext?: WorldContext) {
		// localStorage 클리어
		if (browser) {
			localStorage.removeItem(TEST_WORLD_SNAPSHOT_KEY);
		}

		// 현재 월드 삭제 (모든 엔티티 포함)
		await deleteWorld(TEST_WORLD_ID, worldContext);

		// 스토어를 기본 상태로 리셋 (open, modalScreenVector 상태는 유지)
		const { open, modalScreenVector } = get(store);
		store.set({ ...defaultState, open, modalScreenVector });

		// 기본 플레이어/시나리오 컨텍스트 복원
		ensureContext();
	}

	function init() {
		// 플레이어/시나리오 컨텍스트를 먼저 설정 (selectPlayer 포함)
		ensureContext();

		// TestWorldSnapshot의 엔티티 데이터를 World 객체로 조립하여 worldStore에 복원
		const { worldStore } = useWorld();
		const world: World = {
			id: TEST_WORLD_ID,
			user_id: stored.player.user_id,
			player_id: stored.player.id,
			scenario_id: stored.playerScenario.scenario_id,
			terrain_id: stored.selectedTerrainId ?? null,
			name: 'Test World',
			created_at: new Date().toISOString(),
			deleted_at: null,
			updated_at: null,
			snapshot: {
				worldCharacters: stored.worldCharacters ?? {},
				worldCharacterNeeds: stored.worldCharacterNeeds ?? {},
				worldBuildings: stored.worldBuildings ?? {},
				worldBuildingConditions: stored.worldBuildingConditions ?? {},
				worldItems: stored.worldItems ?? {},
				worldTileMap: stored.worldTileMap,
			},
		};
		worldStore.set({
			status: 'success',
			data: { [TEST_WORLD_ID]: world } as Record<WorldId, World>,
			error: undefined,
		});
	}

	return {
		store,
		setSelectedTerrainId,
		setDebug,
		setOpen,
		setModalScreenVector,
		setOpenPanel,
		save: () => save(get(store)),
		reset,
		init,
	};
}

export function useWorldTest() {
	if (!instance) {
		instance = createTestWorldStore();
	}
	return instance;
}

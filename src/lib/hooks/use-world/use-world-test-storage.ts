import { browser } from '$app/environment';
import type { PlayerScenarioId } from '$lib/types';
import type { TestWorldSnapshot } from '$lib/types/hooks';
import { useWorld } from './use-world';
import { vectorUtils } from '$lib/utils/vector';
import {
	TEST_USER_ID,
	TEST_WORLD_ID,
	TEST_PLAYER_ID,
	TEST_SCENARIO_ID,
	TEST_SCENARIO_SNAPSHOT_ID,
	TEST_WORLD_SNAPSHOT_KEY,
} from '$lib/constants';

export const defaultState: TestWorldSnapshot = {
	open: false,
	openPanel: true,
	selectedTerrainId: undefined,
	modalScreenVector: vectorUtils.createScreenVector(0, 0),
	debug: false,
	worlds: {},
	player: {
		id: TEST_PLAYER_ID,
		user_id: TEST_USER_ID,
		name: '테스트 플레이어',
		avatar: null,
		bio: null,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		deleted_at: null,
	},
	playerScenario: {
		id: crypto.randomUUID() as PlayerScenarioId,
		player_id: TEST_PLAYER_ID,
		scenario_id: TEST_SCENARIO_ID,
		status: 'in_progress',
		current_tick: 0,
		created_at: new Date().toISOString(),
		user_id: TEST_USER_ID,
		scenario_snapshot_id: TEST_SCENARIO_SNAPSHOT_ID,
	},
};

export function load(): TestWorldSnapshot {
	if (!browser) return defaultState;

	try {
		const saved = localStorage.getItem(TEST_WORLD_SNAPSHOT_KEY);
		if (saved) {
			const stored: TestWorldSnapshot = JSON.parse(saved);
			// worlds에서 terrain ID 찾아 selectedTerrainId 설정
			const world = stored.worlds?.[TEST_WORLD_ID];
			return {
				open: stored.open ?? defaultState.open,
				openPanel: stored.openPanel ?? defaultState.openPanel,
				selectedTerrainId: world?.terrain_id ?? undefined,
				modalScreenVector: stored.modalScreenVector ?? defaultState.modalScreenVector,
				debug: stored.debug ?? defaultState.debug,
				worlds: stored.worlds ?? {},
				player: stored.player ?? defaultState.player,
				playerScenario: stored.playerScenario ?? defaultState.playerScenario,
			};
		}
	} catch {
		// ignore parse errors
	}
	return defaultState;
}

export function save(state: TestWorldSnapshot) {
	if (!browser) return;
	try {
		// buildSnapshot으로 현재 스토어 상태를 WorldSnapshot으로 빌드
		const { buildSnapshot } = useWorld();
		const snapshot = buildSnapshot(TEST_WORLD_ID);

		const stored: TestWorldSnapshot = {
			...state,
			...snapshot,
		};
		localStorage.setItem(TEST_WORLD_SNAPSHOT_KEY, JSON.stringify(stored));
	} catch (e) {
		console.error(e);
	}
}

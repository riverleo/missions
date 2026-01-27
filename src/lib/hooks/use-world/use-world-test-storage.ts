import { get } from 'svelte/store';
import { browser } from '$app/environment';
import type {
	WorldCharacter,
	WorldCharacterNeed,
	WorldCharacterNeedId,
	WorldBuilding,
	WorldBuildingCondition,
	WorldBuildingConditionId,
	WorldItem,
	WorldTileMap,
	WorldId,
	WorldCharacterId,
	WorldBuildingId,
	WorldItemId,
	PlayerScenario,
	PlayerScenarioId,
} from '$lib/types';
import type { StoredState } from '$lib/types/hooks';
import { useWorld } from './use-world';
import { usePlayer } from '../use-player';
import { useCurrent } from '../use-current';
import { vectorUtils } from '$lib/utils/vector';
import {
	TEST_USER_ID,
	TEST_WORLD_ID,
	TEST_PLAYER_ID,
	TEST_SCENARIO_ID,
	TEST_SCENARIO_SNAPSHOT_ID,
	TEST_WORLD_STATE_STORAGE_KEY,
} from '$lib/constants';

export const defaultState: StoredState = {
	open: false,
	openPanel: true,
	selectedTerrainId: undefined,
	modalScreenVector: vectorUtils.createScreenVector(0, 0),
	debug: false,
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

export function load(): StoredState {
	if (!browser) return defaultState;

	try {
		const saved = localStorage.getItem(TEST_WORLD_STATE_STORAGE_KEY);
		if (saved) {
			const stored: StoredState = JSON.parse(saved);
			// worlds에서 terrain ID 찾아 selectedTerrainId 설정
			const world = stored.worlds?.[TEST_WORLD_ID];
			return {
				open: stored.open ?? defaultState.open,
				openPanel: stored.openPanel ?? defaultState.openPanel,
				selectedTerrainId: world?.terrain_id ?? undefined,
				modalScreenVector: stored.modalScreenVector ?? defaultState.modalScreenVector,
				debug: stored.debug ?? defaultState.debug,
				worlds: stored.worlds,
				worldCharacters: stored.worldCharacters,
				worldCharacterNeeds: stored.worldCharacterNeeds,
				worldBuildings: stored.worldBuildings,
				worldBuildingConditions: stored.worldBuildingConditions,
				worldItems: stored.worldItems,
				worldTileMaps: stored.worldTileMaps,
				player: stored.player ?? defaultState.player,
				playerScenario: stored.playerScenario ?? defaultState.playerScenario,
			};
		}
	} catch {
		// ignore parse errors
	}
	return defaultState;
}

export function save(state: StoredState) {
	if (!browser) return;
	try {
		// useWorld 스토어에서 TEST_WORLD_ID와 관련된 데이터만 필터링
		const world = useWorld();
		const worlds = get(world.worldStore).data;
		const worldCharacters = get(world.worldCharacterStore).data;
		const worldCharacterNeeds = get(world.worldCharacterNeedStore).data;
		const worldBuildings = get(world.worldBuildingStore).data;
		const worldBuildingConditions = get(world.worldBuildingConditionStore).data;
		const worldItems = get(world.worldItemStore).data;
		const worldTileMaps = get(world.worldTileMapStore).data;

		// usePlayer 스토어에서 TEST_PLAYER_ID와 관련된 데이터만 가져오기
		const player = usePlayer();
		const players = get(player.playerStore).data;
		const playerScenarios = get(player.playerScenarioStore).data;

		// useCurrent에서 tick 값 가져오기
		const current = useCurrent();
		const currentTick = get(current.tickStore);

		const testWorld = worlds[TEST_WORLD_ID];
		const testWorldCharacters: Record<WorldCharacterId, WorldCharacter> = {};
		const testWorldCharacterNeeds: Record<WorldCharacterNeedId, WorldCharacterNeed> = {};
		const testWorldBuildings: Record<WorldBuildingId, WorldBuilding> = {};
		const testWorldBuildingConditions: Record<WorldBuildingConditionId, WorldBuildingCondition> =
			{};
		const testWorldItems: Record<WorldItemId, WorldItem> = {};
		const testWorldTileMaps: Record<WorldId, WorldTileMap> = {};

		for (const [id, character] of Object.entries(worldCharacters)) {
			if (character.world_id === TEST_WORLD_ID) {
				testWorldCharacters[id as WorldCharacterId] = character;
			}
		}

		for (const [id, need] of Object.entries(worldCharacterNeeds)) {
			if (need.world_id === TEST_WORLD_ID) {
				testWorldCharacterNeeds[id as WorldCharacterNeedId] = need;
			}
		}

		for (const [id, building] of Object.entries(worldBuildings)) {
			if (building.world_id === TEST_WORLD_ID) {
				testWorldBuildings[id as WorldBuildingId] = building;
			}
		}

		for (const [id, condition] of Object.entries(worldBuildingConditions)) {
			if (condition.world_id === TEST_WORLD_ID) {
				testWorldBuildingConditions[id as WorldBuildingConditionId] = condition;
			}
		}

		for (const [id, item] of Object.entries(worldItems)) {
			if (item.world_id === TEST_WORLD_ID) {
				testWorldItems[id as WorldItemId] = item;
			}
		}

		for (const [id, tileMap] of Object.entries(worldTileMaps)) {
			if (tileMap.world_id === TEST_WORLD_ID) {
				testWorldTileMaps[id as WorldId] = tileMap;
			}
		}

		// TEST_PLAYER_ID와 관련된 player와 playerScenario 가져오기
		const testPlayer = players[TEST_PLAYER_ID];
		let testPlayerScenario: PlayerScenario | undefined;
		for (const scenario of Object.values(playerScenarios)) {
			if (scenario.player_id === TEST_PLAYER_ID) {
				testPlayerScenario = scenario;
				break;
			}
		}

		// playerScenario의 current_tick을 현재 tick으로 업데이트
		const finalPlayerScenario = testPlayerScenario
			? { ...testPlayerScenario, current_tick: currentTick }
			: { ...defaultState.playerScenario, current_tick: currentTick };

		const stored: StoredState = {
			...state,
			worlds: testWorld ? { [TEST_WORLD_ID]: testWorld } : {},
			worldCharacters: testWorldCharacters,
			worldCharacterNeeds: testWorldCharacterNeeds,
			worldBuildings: testWorldBuildings,
			worldBuildingConditions: testWorldBuildingConditions,
			worldItems: testWorldItems,
			worldTileMaps: testWorldTileMaps,
			player: testPlayer ?? defaultState.player,
			playerScenario: finalPlayerScenario,
		};
		localStorage.setItem(TEST_WORLD_STATE_STORAGE_KEY, JSON.stringify(stored));
	} catch (e) {
		console.error(e);
	}
}

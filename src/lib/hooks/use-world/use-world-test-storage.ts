import { get } from 'svelte/store';
import { browser } from '$app/environment';
import type {
	World,
	WorldCharacter,
	WorldBuilding,
	WorldItem,
	WorldTileMap,
	WorldId,
	WorldCharacterId,
	WorldBuildingId,
	WorldItemId,
	WorldTileMapId,
	TerrainId,
	EntityId,
} from '$lib/types';
import { useWorld } from './use-world';
import { TEST_WORLD_ID } from './use-world-test';

const STORAGE_KEY = 'test-world-state';

export interface WorldTestStoreState {
	open: boolean;
	selectedTerrainId?: TerrainId;
	selectedEntityId?: EntityId;
	// 모달 위치 (픽셀 단위)
	modalX: number;
	modalY: number;
	debug: boolean;
	commandPanelOpen: boolean;
	inspectorPanelOpen: boolean;
}

// localStorage 저장 포맷 (WorldTestStoreState + world 데이터)
export interface StoredState extends WorldTestStoreState {
	worlds?: Record<WorldId, World>;
	worldCharacters?: Record<WorldCharacterId, WorldCharacter>;
	worldBuildings?: Record<WorldBuildingId, WorldBuilding>;
	worldItems?: Record<WorldItemId, WorldItem>;
	worldTileMaps?: Record<WorldId, WorldTileMap>;
}

const defaultState: WorldTestStoreState = {
	open: false,
	selectedTerrainId: undefined,
	selectedEntityId: undefined,
	modalX: 0,
	modalY: 0,
	debug: false,
	commandPanelOpen: true,
	inspectorPanelOpen: true,
};

export function loadFromStorage(): StoredState {
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
				selectedEntityId: stored.selectedEntityId,
				modalX: stored.modalX ?? defaultState.modalX,
				modalY: stored.modalY ?? defaultState.modalY,
				debug: stored.debug ?? defaultState.debug,
				commandPanelOpen: stored.commandPanelOpen ?? defaultState.commandPanelOpen,
				inspectorPanelOpen: stored.inspectorPanelOpen ?? defaultState.inspectorPanelOpen,
				worlds: stored.worlds,
				worldCharacters: stored.worldCharacters,
				worldBuildings: stored.worldBuildings,
				worldItems: stored.worldItems,
				worldTileMaps: stored.worldTileMaps,
			};
		}
	} catch {
		// ignore parse errors
	}
	return defaultState;
}

export function saveToStorage(state: WorldTestStoreState) {
	if (!browser) return;
	try {
		// useWorld 스토어에서 TEST_WORLD_ID와 관련된 데이터만 필터링
		const world = useWorld();
		const worlds = get(world.worldStore).data;
		const worldCharacters = get(world.worldCharacterStore).data;
		const worldBuildings = get(world.worldBuildingStore).data;
		const worldItems = get(world.worldItemStore).data;
		const worldTileMaps = get(world.worldTileMapStore).data;

		const testWorld = worlds[TEST_WORLD_ID];
		const testWorldCharacters: Record<WorldCharacterId, WorldCharacter> = {};
		const testWorldBuildings: Record<WorldBuildingId, WorldBuilding> = {};
		const testWorldItems: Record<WorldItemId, WorldItem> = {};
		const testWorldTileMaps: Record<WorldId, WorldTileMap> = {};

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

		const stored: StoredState = {
			...state,
			worlds: testWorld ? { [TEST_WORLD_ID]: testWorld } : {},
			worldCharacters: testWorldCharacters,
			worldBuildings: testWorldBuildings,
			worldItems: testWorldItems,
			worldTileMaps: testWorldTileMaps,
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
	} catch (e) {
		console.error(e);
	}
}

import { get } from 'svelte/store';
import { browser } from '$app/environment';
import type {
	World,
	WorldCharacter,
	WorldBuilding,
	WorldId,
	WorldCharacterId,
	WorldBuildingId,
	TerrainId,
	CharacterId,
	BuildingId,
	ItemId,
} from '$lib/types';
import { useWorld } from './use-world';

const STORAGE_KEY = 'test-world-state';
const TEST_WORLD_ID = 'test-world-id' as WorldId;

export interface WorldTestStoreState {
	open: boolean;
	selectedTerrainId?: TerrainId;
	selectedCharacterId?: CharacterId;
	selectedBuildingId?: BuildingId;
	selectedItemId?: ItemId;
	// 모달 위치 (픽셀 단위)
	modalX: number;
	modalY: number;
	debug: boolean;
	eraser: boolean;
	commandPanelOpen: boolean;
	inspectorPanelOpen: boolean;
}

// localStorage 저장 포맷 (WorldTestStoreState + world 데이터)
export interface StoredState extends WorldTestStoreState {
	worlds?: Record<WorldId, World>;
	worldCharacters?: Record<WorldCharacterId, WorldCharacter>;
	worldBuildings?: Record<WorldBuildingId, WorldBuilding>;
}

const defaultState: WorldTestStoreState = {
	open: false,
	selectedTerrainId: undefined,
	selectedCharacterId: undefined,
	selectedBuildingId: undefined,
	selectedItemId: undefined,
	modalX: 0,
	modalY: 0,
	debug: false,
	eraser: false,
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
				selectedCharacterId: stored.selectedCharacterId,
				selectedBuildingId: stored.selectedBuildingId,
				selectedItemId: stored.selectedItemId,
				modalX: stored.modalX ?? defaultState.modalX,
				modalY: stored.modalY ?? defaultState.modalY,
				debug: stored.debug ?? defaultState.debug,
				eraser: stored.eraser ?? defaultState.eraser,
				commandPanelOpen: stored.commandPanelOpen ?? defaultState.commandPanelOpen,
				inspectorPanelOpen: stored.inspectorPanelOpen ?? defaultState.inspectorPanelOpen,
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

export function saveToStorage(state: WorldTestStoreState) {
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
	} catch (e) {
		console.error(e);
	}
}

import { writable, get } from 'svelte/store';
import { produce } from 'immer';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { useInteraction } from '$lib/hooks/use-interaction';
import type {
	RecordFetchState,
	World,
	WorldCharacter,
	WorldCharacterNeed,
	WorldBuilding,
	WorldBuildingCondition,
	WorldItem,
	WorldTileMap,
	WorldSnapshot,
	WorldId,
	WorldCharacterId,
	WorldCharacterNeedId,
	WorldBuildingId,
	WorldBuildingConditionId,
	WorldItemId,
	EntityId,
	EntityInstance,
	EntitySourceId,
	BehaviorAction,
	PlayerScenario,
} from '$lib/types';
import { usePlayer } from '../use-player';
import { useApp } from '$lib/hooks/use-app.svelte';
import { useCurrent } from '../use-current';

// World Store (Singleton hook)
let instance: ReturnType<typeof createWorldStore> | null = null;

function createWorldStore() {
	const { supabase } = useApp();
	let initialized = false;

	const worldStore = writable<RecordFetchState<WorldId, World>>({
		status: 'idle',
		data: {},
	});

	const worldCharacterStore = writable<RecordFetchState<WorldCharacterId, WorldCharacter>>({
		status: 'idle',
		data: {},
	});

	const worldCharacterNeedStore = writable<
		RecordFetchState<WorldCharacterNeedId, WorldCharacterNeed>
	>({
		status: 'idle',
		data: {},
	});

	const worldBuildingStore = writable<RecordFetchState<WorldBuildingId, WorldBuilding>>({
		status: 'idle',
		data: {},
	});

	const worldBuildingConditionStore = writable<
		RecordFetchState<WorldBuildingConditionId, WorldBuildingCondition>
	>({
		status: 'idle',
		data: {},
	});

	const worldItemStore = writable<RecordFetchState<WorldItemId, WorldItem>>({
		status: 'idle',
		data: {},
	});

	const worldTileMapStore = writable<RecordFetchState<WorldId, WorldTileMap>>({
		status: 'idle',
		data: {},
	});

	const selectedEntityIdStore = writable<{ entityId: EntityId | undefined }>({
		entityId: undefined,
	});

	function init() {
		initialized = true;
	}

	function setSelectedEntityId(entityId: EntityId | undefined) {
		selectedEntityIdStore.update((state) => ({ ...state, entityId }));
	}

	// Getter functions - throw if not found
	function getWorld(id: string): World {
		const data = getOrUndefinedWorld(id);
		if (!data) throw new Error(`World not found: ${id}`);
		return data;
	}

	function getWorldCharacter(id: string): WorldCharacter {
		const data = getOrUndefinedWorldCharacter(id);
		if (!data) throw new Error(`WorldCharacter not found: ${id}`);
		return data;
	}

	function getWorldCharacterNeed(id: string): WorldCharacterNeed {
		const data = getOrUndefinedWorldCharacterNeed(id);
		if (!data) throw new Error(`WorldCharacterNeed not found: ${id}`);
		return data;
	}

	function getWorldBuilding(id: string): WorldBuilding {
		const data = getOrUndefinedWorldBuilding(id);
		if (!data) throw new Error(`WorldBuilding not found: ${id}`);
		return data;
	}

	function getWorldBuildingCondition(id: string): WorldBuildingCondition {
		const data = getOrUndefinedWorldBuildingCondition(id);
		if (!data) throw new Error(`WorldBuildingCondition not found: ${id}`);
		return data;
	}

	function getWorldItem(id: string): WorldItem {
		const data = get(worldItemStore).data[id as WorldItemId];
		if (!data) throw new Error(`WorldItem not found: ${id}`);
		return data;
	}

	function getWorldTileMap(worldId: string): WorldTileMap {
		const data = get(worldTileMapStore).data[worldId as WorldId];
		if (!data) throw new Error(`WorldTileMap not found: ${worldId}`);
		return data;
	}

	// Getter functions - return undefined if not found
	function getOrUndefinedWorld(id: string | null | undefined): World | undefined {
		if (!id) return undefined;
		return get(worldStore).data[id as WorldId];
	}

	function getOrUndefinedWorldCharacter(id: string | null | undefined): WorldCharacter | undefined {
		if (!id) return undefined;
		return get(worldCharacterStore).data[id as WorldCharacterId];
	}

	function getOrUndefinedWorldCharacterNeed(
		id: string | null | undefined
	): WorldCharacterNeed | undefined {
		if (!id) return undefined;
		return get(worldCharacterNeedStore).data[id as WorldCharacterNeedId];
	}

	function getOrUndefinedWorldBuilding(id: string | null | undefined): WorldBuilding | undefined {
		if (!id) return undefined;
		return get(worldBuildingStore).data[id as WorldBuildingId];
	}

	function getOrUndefinedWorldBuildingCondition(
		id: string | null | undefined
	): WorldBuildingCondition | undefined {
		if (!id) return undefined;
		return get(worldBuildingConditionStore).data[id as WorldBuildingConditionId];
	}

	function getOrUndefinedWorldItem(id: string | null | undefined): WorldItem | undefined {
		if (!id) return undefined;
		return get(worldItemStore).data[id as WorldItemId];
	}

	function getOrUndefinedWorldTileMap(
		worldId: string | null | undefined
	): WorldTileMap | undefined {
		if (!worldId) return undefined;
		return get(worldTileMapStore).data[worldId as WorldId];
	}

	// GetAll functions
	function getAllWorlds(): World[] {
		return Object.values(get(worldStore).data);
	}

	function getAllWorldCharacters(): WorldCharacter[] {
		return Object.values(get(worldCharacterStore).data);
	}

	function getAllWorldCharacterNeeds(): WorldCharacterNeed[] {
		return Object.values(get(worldCharacterNeedStore).data);
	}

	function getAllWorldBuildings(): WorldBuilding[] {
		return Object.values(get(worldBuildingStore).data);
	}

	function getAllWorldBuildingConditions(): WorldBuildingCondition[] {
		return Object.values(get(worldBuildingConditionStore).data);
	}

	function getAllWorldItems(): WorldItem[] {
		return Object.values(get(worldItemStore).data);
	}

	function getAllWorldTileMaps(): WorldTileMap[] {
		return Object.values(get(worldTileMapStore).data);
	}

	function updateWorldCharacter(id: WorldCharacterId, update: Partial<WorldCharacter>): void {
		worldCharacterStore.update((state) =>
			produce(state, (draft) => {
				const worldCharacter = draft.data[id];
				if (worldCharacter) {
					Object.assign(worldCharacter, update);
				}
			})
		);
	}

	function updateWorldCharacterNeed(
		id: WorldCharacterNeedId,
		update: Partial<WorldCharacterNeed>
	): void {
		worldCharacterNeedStore.update((state) =>
			produce(state, (draft) => {
				const need = draft.data[id];
				if (need) {
					Object.assign(need, update);
				}
			})
		);
	}

	function updateWorldBuildingCondition(
		id: WorldBuildingConditionId,
		update: Partial<WorldBuildingCondition>
	): void {
		worldBuildingConditionStore.update((state) =>
			produce(state, (draft) => {
				const condition = draft.data[id];
				if (condition) {
					Object.assign(condition, update);
				}
			})
		);
	}

	function updateWorldItem(id: WorldItemId, update: Partial<WorldItem>): void {
		worldItemStore.update((state) =>
			produce(state, (draft) => {
				const worldItem = draft.data[id];
				if (worldItem) {
					Object.assign(worldItem, update);
				}
			})
		);
	}

	/**
	 * EntityId로부터 EntityInstance를 반환
	 */
	function getEntityInstance(entityId: EntityId): EntityInstance {
		const { type, instanceId } = EntityIdUtils.parse(entityId);

		let entity: EntityInstance | undefined;

		if (type === 'building') {
			const worldBuilding = getWorldBuilding(instanceId);
			entity = worldBuilding ? EntityIdUtils.to(worldBuilding) : undefined;
		} else if (type === 'item') {
			const worldItem = getWorldItem(instanceId);
			entity = worldItem ? EntityIdUtils.to(worldItem) : undefined;
		} else if (type === 'character') {
			const worldCharacter = getWorldCharacter(instanceId);
			entity = worldCharacter ? EntityIdUtils.to(worldCharacter) : undefined;
		}

		if (!entity) {
			throw new Error(`Entity not found: ${entityId}`);
		}

		return entity;
	}

	/**
	 * EntityId, EntityInstance, 또는 BehaviorAction으로부터 템플릿 ID를 추출
	 */
	function getEntitySourceId(entityId: EntityId): EntitySourceId;
	function getEntitySourceId(entityInstance: EntityInstance): EntitySourceId;
	function getEntitySourceId(behaviorAction: BehaviorAction): EntitySourceId;
	function getEntitySourceId(data: EntityId | EntityInstance | BehaviorAction): EntitySourceId {
		let result: EntitySourceId | undefined;

		// EntityId인 경우
		if (typeof data === 'string') {
			const entityInstance = getEntityInstance(data);
			result = getOrUndefinedEntitySourceId(entityInstance);
		}
		// EntityInstance인 경우
		else if ('entityType' in data) {
			result = getOrUndefinedEntitySourceId(data);
		}
		// BehaviorAction인 경우
		else {
			result = getOrUndefinedEntitySourceId(data);
		}

		if (!result) {
			throw new Error('Entity source not found');
		}
		return result;
	}

	function getOrUndefinedEntitySourceId(entityId: EntityId): EntitySourceId | undefined;
	function getOrUndefinedEntitySourceId(entityInstance: EntityInstance): EntitySourceId | undefined;
	function getOrUndefinedEntitySourceId(behaviorAction: BehaviorAction): EntitySourceId | undefined;
	function getOrUndefinedEntitySourceId(
		data: EntityId | EntityInstance | BehaviorAction
	): EntitySourceId | undefined {
		// EntityId인 경우
		if (typeof data === 'string') {
			const entityInstance = getEntityInstance(data);
			return getOrUndefinedEntitySourceId(entityInstance);
		}

		// EntityInstance인 경우
		if ('entityType' in data) {
			if (data.entityType === 'building') {
				return data.building_id;
			} else if (data.entityType === 'item') {
				return data.item_id;
			} else if (data.entityType === 'character') {
				return data.character_id;
			} else {
				return data.id;
			}
		}

		// BehaviorAction인 경우
		const { getOrUndefinedInteractionByBehaviorAction } = useInteraction();
		const interaction = getOrUndefinedInteractionByBehaviorAction(data);
		if (!interaction) return undefined;

		if (interaction.entitySourceType === 'building') {
			return interaction.building_id ?? undefined;
		} else if (interaction.entitySourceType === 'item') {
			return interaction.item_id ?? undefined;
		} else if (interaction.entitySourceType === 'character') {
			return interaction.target_character_id ?? undefined;
		}
		return undefined;
	}

	async function fetch() {
		if (!initialized) {
			throw new Error('useWorld not initialized. Call init() first.');
		}

		worldStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			// Player 조회
			const { playerStore } = useCurrent();
			const player = get(playerStore);
			if (!player) return;

			// worlds 테이블에서 조회 (snapshot 포함)
			const { data: worldData, error: worldError } = await supabase
				.from('worlds')
				.select('*')
				.eq('player_id', player.id);

			if (worldError) throw worldError;

			// World 데이터 변환
			const worldRecord: Record<WorldId, World> = {};
			// 스냅샷에서 엔티티 데이터 병합
			const characterRecord: Record<WorldCharacterId, WorldCharacter> = {};
			const characterNeedRecord: Record<WorldCharacterNeedId, WorldCharacterNeed> = {};
			const buildingRecord: Record<WorldBuildingId, WorldBuilding> = {};
			const buildingConditionRecord: Record<WorldBuildingConditionId, WorldBuildingCondition> = {};
			const itemRecord: Record<WorldItemId, WorldItem> = {};
			const tileMapRecord: Record<WorldId, WorldTileMap> = {};

			for (const world of worldData ?? []) {
				worldRecord[world.id as WorldId] = world as World;

				// snapshot이 있으면 엔티티 데이터를 파싱하여 스토어에 병합
				const snapshot = world.snapshot as WorldSnapshot | null;
				if (snapshot) {
					if (snapshot.worldCharacters) {
						Object.assign(characterRecord, snapshot.worldCharacters);
					}
					if (snapshot.worldCharacterNeeds) {
						Object.assign(characterNeedRecord, snapshot.worldCharacterNeeds);
					}
					if (snapshot.worldBuildings) {
						Object.assign(buildingRecord, snapshot.worldBuildings);
					}
					if (snapshot.worldBuildingConditions) {
						Object.assign(buildingConditionRecord, snapshot.worldBuildingConditions);
					}
					if (snapshot.worldItems) {
						Object.assign(itemRecord, snapshot.worldItems);
					}
					if (snapshot.worldTileMaps) {
						Object.assign(tileMapRecord, snapshot.worldTileMaps);
					}
				}
			}

			worldStore.update((state) => ({
				...state,
				status: 'success' as const,
				data: worldRecord,
				error: undefined,
			}));

			worldCharacterStore.update((state) =>
				produce(state, (draft) => {
					draft.status = 'success';
					draft.data = characterRecord;
					draft.error = undefined;
				})
			);

			worldCharacterNeedStore.update((state) =>
				produce(state, (draft) => {
					draft.status = 'success';
					draft.data = characterNeedRecord;
					draft.error = undefined;
				})
			);

			worldBuildingStore.update((state) =>
				produce(state, (draft) => {
					draft.status = 'success';
					draft.data = buildingRecord;
					draft.error = undefined;
				})
			);

			worldBuildingConditionStore.update((state) =>
				produce(state, (draft) => {
					draft.status = 'success';
					draft.data = buildingConditionRecord;
					draft.error = undefined;
				})
			);

			worldItemStore.update((state) =>
				produce(state, (draft) => {
					draft.status = 'success';
					draft.data = itemRecord;
					draft.error = undefined;
				})
			);

			worldTileMapStore.update((state) =>
				produce(state, (draft) => {
					draft.status = 'success';
					draft.data = tileMapRecord;
					draft.error = undefined;
				})
			);
		} catch (error) {
			console.error('Failed to fetch world:', error);
			worldStore.update((state) => ({
				...state,
				status: 'error',
				error: error instanceof Error ? error : new Error(String(error)),
			}));
		}
	}

	/**
	 * 특정 월드의 현재 스토어 상태를 WorldSnapshot으로 빌드
	 */
	function buildSnapshot(worldId: WorldId): WorldSnapshot {
		const worldCharacters = get(worldCharacterStore).data;
		const worldCharacterNeeds = get(worldCharacterNeedStore).data;
		const worldBuildings = get(worldBuildingStore).data;
		const worldBuildingConditions = get(worldBuildingConditionStore).data;
		const worldItems = get(worldItemStore).data;
		const worldTileMaps = get(worldTileMapStore).data;
		const worlds = get(worldStore).data;

		const { playerStore, tickStore } = useCurrent();
		const player = get(playerStore);
		const { playerScenarioStore: playerScenarioAllStore } = usePlayer();
		const currentTick = get(tickStore);

		// 해당 worldId에 속하는 데이터만 필터링
		const filteredCharacters: Record<WorldCharacterId, WorldCharacter> = {};
		for (const [id, c] of Object.entries(worldCharacters)) {
			if (c.world_id === worldId) filteredCharacters[id as WorldCharacterId] = c;
		}

		const filteredCharacterNeeds: Record<WorldCharacterNeedId, WorldCharacterNeed> = {};
		for (const [id, n] of Object.entries(worldCharacterNeeds)) {
			if (n.world_id === worldId) filteredCharacterNeeds[id as WorldCharacterNeedId] = n;
		}

		const filteredBuildings: Record<WorldBuildingId, WorldBuilding> = {};
		for (const [id, b] of Object.entries(worldBuildings)) {
			if (b.world_id === worldId) filteredBuildings[id as WorldBuildingId] = b;
		}

		const filteredBuildingConditions: Record<WorldBuildingConditionId, WorldBuildingCondition> = {};
		for (const [id, bc] of Object.entries(worldBuildingConditions)) {
			if (bc.world_id === worldId) filteredBuildingConditions[id as WorldBuildingConditionId] = bc;
		}

		const filteredItems: Record<WorldItemId, WorldItem> = {};
		for (const [id, item] of Object.entries(worldItems)) {
			if (item.world_id === worldId) filteredItems[id as WorldItemId] = item;
		}

		const filteredTileMaps: Record<WorldId, WorldTileMap> = {};
		const tileMap = worldTileMaps[worldId];
		if (tileMap) filteredTileMaps[worldId] = tileMap;

		// Player/PlayerScenario 가져오기
		const playerScenarios = get(playerScenarioAllStore).data;
		let playerScenario: PlayerScenario | undefined;
		for (const ps of Object.values(playerScenarios)) {
			if (ps.player_id === player?.id) {
				playerScenario = ps;
				break;
			}
		}

		// playerScenario의 current_tick을 현재 tick으로 업데이트
		const finalPlayerScenario: PlayerScenario = playerScenario
			? { ...playerScenario, current_tick: currentTick }
			: ({} as PlayerScenario);

		return {
			worlds: worlds[worldId] ? { [worldId]: worlds[worldId] } : {},
			worldCharacters: filteredCharacters,
			worldCharacterNeeds: filteredCharacterNeeds,
			worldBuildings: filteredBuildings,
			worldBuildingConditions: filteredBuildingConditions,
			worldItems: filteredItems,
			worldTileMaps: filteredTileMaps,
			player: player!,
			playerScenario: finalPlayerScenario,
		};
	}

	/**
	 * 월드 상태를 worlds.snapshot 컬럼에 저장
	 */
	async function saveSnapshot(worldId: WorldId): Promise<void> {
		const snapshot = buildSnapshot(worldId);

		const { error } = await supabase
			.from('worlds')
			.update({
				snapshot: JSON.parse(JSON.stringify(snapshot)),
				updated_at: new Date().toISOString(),
			})
			.eq('id', worldId);

		if (error) {
			console.error('Failed to save snapshot:', error);
			throw error;
		}
	}

	/**
	 * DB의 worlds.snapshot에서 스냅샷을 로드하여 스토어 복원
	 */
	async function loadSnapshot(worldId: WorldId): Promise<void> {
		const { data, error } = await supabase.from('worlds').select('*').eq('id', worldId).single();

		if (error || !data) {
			console.error('Failed to load snapshot:', error);
			throw error;
		}

		const world = data as World;
		const snapshot = data.snapshot as WorldSnapshot | null;

		// World 스토어 업데이트
		worldStore.update((state) => ({
			...state,
			status: 'success' as const,
			data: { ...state.data, [worldId]: world },
		}));

		if (!snapshot) return;

		// 스냅샷에서 엔티티 데이터 복원
		if (snapshot.worldCharacters) {
			worldCharacterStore.update((state) => ({
				...state,
				status: 'success' as const,
				data: { ...state.data, ...snapshot.worldCharacters },
			}));
		}

		if (snapshot.worldCharacterNeeds) {
			worldCharacterNeedStore.update((state) => ({
				...state,
				status: 'success' as const,
				data: { ...state.data, ...snapshot.worldCharacterNeeds },
			}));
		}

		if (snapshot.worldBuildings) {
			worldBuildingStore.update((state) => ({
				...state,
				status: 'success' as const,
				data: { ...state.data, ...snapshot.worldBuildings },
			}));
		}

		if (snapshot.worldBuildingConditions) {
			worldBuildingConditionStore.update((state) => ({
				...state,
				status: 'success' as const,
				data: { ...state.data, ...snapshot.worldBuildingConditions },
			}));
		}

		if (snapshot.worldItems) {
			worldItemStore.update((state) => ({
				...state,
				status: 'success' as const,
				data: { ...state.data, ...snapshot.worldItems },
			}));
		}

		if (snapshot.worldTileMaps) {
			worldTileMapStore.update((state) => ({
				...state,
				status: 'success' as const,
				data: { ...state.data, ...snapshot.worldTileMaps },
			}));
		}

		// Player/PlayerScenario 복원
		if (snapshot.player) {
			const { playerStore: pStore, playerScenarioStore: psStore } = usePlayer();
			pStore.update((state) =>
				produce(state, (draft) => {
					draft.data[snapshot.player.id] = snapshot.player;
					draft.status = 'success';
				})
			);

			if (snapshot.playerScenario) {
				psStore.update((state) =>
					produce(state, (draft) => {
						draft.data[snapshot.playerScenario.id] = snapshot.playerScenario;
						draft.status = 'success';
					})
				);
			}
		}
	}

	return {
		worldStore,
		worldCharacterStore,
		worldCharacterNeedStore,
		worldBuildingStore,
		worldBuildingConditionStore,
		worldItemStore,
		worldTileMapStore,
		selectedEntityIdStore,
		init,
		fetch,
		buildSnapshot,
		saveSnapshot,
		loadSnapshot,
		setSelectedEntityId,
		getWorld,
		getWorldCharacter,
		getWorldCharacterNeed,
		getWorldBuilding,
		getWorldBuildingCondition,
		getWorldItem,
		getWorldTileMap,
		getOrUndefinedWorld,
		getOrUndefinedWorldCharacter,
		getOrUndefinedWorldCharacterNeed,
		getOrUndefinedWorldBuilding,
		getOrUndefinedWorldBuildingCondition,
		getOrUndefinedWorldItem,
		getOrUndefinedWorldTileMap,
		getAllWorlds,
		getAllWorldCharacters,
		getAllWorldCharacterNeeds,
		getAllWorldBuildings,
		getAllWorldBuildingConditions,
		getAllWorldItems,
		getAllWorldTileMaps,
		updateWorldCharacter,
		updateWorldCharacterNeed,
		updateWorldBuildingCondition,
		updateWorldItem,
		getEntityInstance,
		getEntitySourceId,
		getOrUndefinedEntitySourceId,
	};
}

export function useWorld() {
	if (!instance) {
		instance = createWorldStore();
	}
	return instance;
}

import { writable, get } from 'svelte/store';
import { produce } from 'immer';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { useInteraction } from '$lib/hooks/use-interaction';
import type {
	World,
	WorldCharacter,
	WorldCharacterNeed,
	WorldBuilding,
	WorldBuildingCondition,
	WorldItem,
	WorldTileMap,
	WorldData,
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
	Player,
	PlayerId,
	UserId,
	ScenarioId,
	TileCellKey,
	TileId,
	FetchStatus,
} from '$lib/types';
import { usePlayer } from '../use-player';
import { useApp } from '$lib/hooks/use-app.svelte';
import { useCurrent } from '../use-current';

// World Store (Singleton hook)
let instance: ReturnType<typeof createWorldStore> | null = null;

function createWorldStore() {
	const { supabase } = useApp();
	let initialized = false;

	const worldStore = writable({
		status: 'idle' as FetchStatus,
		data: {} as Record<WorldId, WorldData>,
		error: undefined as Error | undefined,
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

	// ============================================================
	// Getter functions - throw if not found
	// ============================================================
	function getWorld(id: string): WorldData {
		const data = get(worldStore).data[id as WorldId];
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
		const data = getOrUndefinedWorldItem(id);
		if (!data) throw new Error(`WorldItem not found: ${id}`);
		return data;
	}

	function getWorldTileMap(worldId: string): WorldTileMap {
		const worldData = get(worldStore).data[worldId as WorldId];
		if (!worldData?.worldTileMap) throw new Error(`WorldTileMap not found: ${worldId}`);
		return worldData.worldTileMap;
	}

	// ============================================================
	// Getter functions - return undefined if not found
	// ============================================================
	function getOrUndefinedWorld(id: string | null | undefined): WorldData | undefined {
		if (!id) return undefined;
		return get(worldStore).data[id as WorldId];
	}

	function getOrUndefinedWorldCharacter(id: string | null | undefined): WorldCharacter | undefined {
		if (!id) return undefined;
		for (const world of Object.values(get(worldStore).data)) {
			const char = world.worldCharacters[id as WorldCharacterId];
			if (char) return char;
		}
		return undefined;
	}

	function getOrUndefinedWorldCharacterNeed(
		id: string | null | undefined
	): WorldCharacterNeed | undefined {
		if (!id) return undefined;
		for (const world of Object.values(get(worldStore).data)) {
			const need = world.worldCharacterNeeds[id as WorldCharacterNeedId];
			if (need) return need;
		}
		return undefined;
	}

	function getOrUndefinedWorldBuilding(id: string | null | undefined): WorldBuilding | undefined {
		if (!id) return undefined;
		for (const world of Object.values(get(worldStore).data)) {
			const building = world.worldBuildings[id as WorldBuildingId];
			if (building) return building;
		}
		return undefined;
	}

	function getOrUndefinedWorldBuildingCondition(
		id: string | null | undefined
	): WorldBuildingCondition | undefined {
		if (!id) return undefined;
		for (const world of Object.values(get(worldStore).data)) {
			const condition = world.worldBuildingConditions[id as WorldBuildingConditionId];
			if (condition) return condition;
		}
		return undefined;
	}

	function getOrUndefinedWorldItem(id: string | null | undefined): WorldItem | undefined {
		if (!id) return undefined;
		for (const world of Object.values(get(worldStore).data)) {
			const item = world.worldItems[id as WorldItemId];
			if (item) return item;
		}
		return undefined;
	}

	function getOrUndefinedWorldTileMap(
		worldId: string | null | undefined
	): WorldTileMap | undefined {
		if (!worldId) return undefined;
		return get(worldStore).data[worldId as WorldId]?.worldTileMap;
	}

	// ============================================================
	// GetAll functions
	// ============================================================
	function getAllWorlds(): WorldData[] {
		return Object.values(get(worldStore).data);
	}

	function getAllWorldCharacters(): WorldCharacter[] {
		return Object.values(get(worldStore).data).flatMap((w) =>
			Object.values(w.worldCharacters)
		);
	}

	function getAllWorldCharacterNeeds(): WorldCharacterNeed[] {
		return Object.values(get(worldStore).data).flatMap((w) =>
			Object.values(w.worldCharacterNeeds)
		);
	}

	function getAllWorldBuildings(): WorldBuilding[] {
		return Object.values(get(worldStore).data).flatMap((w) =>
			Object.values(w.worldBuildings)
		);
	}

	function getAllWorldBuildingConditions(): WorldBuildingCondition[] {
		return Object.values(get(worldStore).data).flatMap((w) =>
			Object.values(w.worldBuildingConditions)
		);
	}

	function getAllWorldItems(): WorldItem[] {
		return Object.values(get(worldStore).data).flatMap((w) => Object.values(w.worldItems));
	}

	function getAllWorldTileMaps(): WorldTileMap[] {
		return Object.values(get(worldStore).data)
			.map((w) => w.worldTileMap)
			.filter((tm): tm is WorldTileMap => tm !== undefined);
	}

	// ============================================================
	// Store CRUD - Helpers
	// ============================================================
	interface EntityContext {
		user_id: UserId;
		player_id: PlayerId;
		scenario_id: ScenarioId;
	}

	function requireCurrentContext() {
		const { playerStore, playerScenarioStore, tickStore } = useCurrent();
		const player = get(playerStore);
		const playerScenario = get(playerScenarioStore);
		if (!player || !playerScenario) {
			throw new Error('player 또는 playerScenario가 초기화되지 않았습니다.');
		}
		return { player, playerScenario, tickStore };
	}

	// ============================================================
	// Store CRUD - Create
	// ============================================================
	function createWorld(
		pick: Pick<WorldData, 'name' | 'terrain_id'> &
			Partial<Pick<WorldData, 'id' | 'user_id' | 'player_id' | 'scenario_id'>>
	): WorldData {
		let ctx: EntityContext;
		if (pick.user_id && pick.player_id && pick.scenario_id) {
			ctx = { user_id: pick.user_id, player_id: pick.player_id, scenario_id: pick.scenario_id };
		} else {
			const { player, playerScenario } = requireCurrentContext();
			ctx = { user_id: player.user_id, player_id: player.id, scenario_id: playerScenario.scenario_id };
		}

		const worldData: WorldData = {
			id: pick.id ?? (crypto.randomUUID() as WorldId),
			user_id: ctx.user_id,
			player_id: ctx.player_id,
			scenario_id: ctx.scenario_id,
			terrain_id: pick.terrain_id,
			name: pick.name,
			created_at: new Date().toISOString(),
			deleted_at: null,
			updated_at: null,
			worldCharacters: {},
			worldCharacterNeeds: {},
			worldBuildings: {},
			worldBuildingConditions: {},
			worldItems: {},
			worldTileMap: undefined,
		};

		worldStore.update((state) => ({
			...state,
			data: { ...state.data, [worldData.id]: worldData },
		}));

		// terrain_id가 있으면 worldTileMap 자동 생성
		if (worldData.terrain_id) {
			createWorldTileMap({ world_id: worldData.id, terrain_id: worldData.terrain_id }, ctx);
		}

		return worldData;
	}

	function createWorldCharacter(
		pick: Pick<WorldCharacter, 'world_id' | 'character_id' | 'x' | 'y'> &
			Partial<Pick<WorldCharacter, 'id' | 'created_at' | 'created_at_tick'>>
	): WorldCharacter {
		const { player, playerScenario, tickStore } = requireCurrentContext();

		const worldCharacter: WorldCharacter = {
			id: pick.id ?? (crypto.randomUUID() as WorldCharacterId),
			world_id: pick.world_id,
			character_id: pick.character_id,
			player_id: player.id,
			scenario_id: playerScenario.scenario_id,
			user_id: player.user_id,
			x: pick.x,
			y: pick.y,
			created_at: pick.created_at ?? new Date().toISOString(),
			created_at_tick: pick.created_at_tick ?? get(tickStore),
			deleted_at: null,
		};

		worldStore.update((state) =>
			produce(state, (draft) => {
				const world = draft.data[pick.world_id];
				if (world) {
					world.worldCharacters[worldCharacter.id] = worldCharacter;
				}
			})
		);

		return worldCharacter;
	}

	function createWorldCharacterNeeds(
		pick: Pick<WorldCharacterNeed, 'world_id' | 'world_character_id' | 'character_id'>,
		needs: Pick<WorldCharacterNeed, 'need_id' | 'value'>[]
	): WorldCharacterNeed[] {
		const { player, playerScenario } = requireCurrentContext();

		const worldCharacterNeeds: WorldCharacterNeed[] = needs.map((n) => ({
			id: crypto.randomUUID() as WorldCharacterNeedId,
			scenario_id: playerScenario.scenario_id,
			user_id: player.user_id,
			player_id: player.id,
			world_id: pick.world_id,
			character_id: pick.character_id,
			world_character_id: pick.world_character_id,
			need_id: n.need_id,
			value: n.value,
			deleted_at: null,
		}));

		worldStore.update((state) =>
			produce(state, (draft) => {
				const world = draft.data[pick.world_id];
				if (world) {
					for (const need of worldCharacterNeeds) {
						world.worldCharacterNeeds[need.id] = need;
					}
				}
			})
		);

		return worldCharacterNeeds;
	}

	function createWorldBuilding(
		pick: Pick<WorldBuilding, 'world_id' | 'building_id' | 'cell_x' | 'cell_y'> &
			Partial<Pick<WorldBuilding, 'id' | 'created_at' | 'created_at_tick'>>
	): WorldBuilding {
		const { player, playerScenario, tickStore } = requireCurrentContext();

		const worldBuilding: WorldBuilding = {
			id: pick.id ?? (crypto.randomUUID() as WorldBuildingId),
			world_id: pick.world_id,
			building_id: pick.building_id,
			player_id: player.id,
			scenario_id: playerScenario.scenario_id,
			user_id: player.user_id,
			cell_x: pick.cell_x,
			cell_y: pick.cell_y,
			created_at: pick.created_at ?? new Date().toISOString(),
			created_at_tick: pick.created_at_tick ?? get(tickStore),
			deleted_at: null,
		};

		worldStore.update((state) =>
			produce(state, (draft) => {
				const world = draft.data[pick.world_id];
				if (world) {
					world.worldBuildings[worldBuilding.id] = worldBuilding;
				}
			})
		);

		return worldBuilding;
	}

	function createWorldBuildingConditions(
		pick: Pick<WorldBuildingCondition, 'world_id' | 'world_building_id' | 'building_id'>,
		conditions: Pick<WorldBuildingCondition, 'building_condition_id' | 'condition_id' | 'value'>[]
	): WorldBuildingCondition[] {
		const { player, playerScenario } = requireCurrentContext();

		const worldBuildingConditions: WorldBuildingCondition[] = conditions.map((c) => ({
			id: crypto.randomUUID() as WorldBuildingConditionId,
			user_id: player.user_id,
			world_id: pick.world_id,
			player_id: player.id,
			scenario_id: playerScenario.scenario_id,
			building_id: pick.building_id,
			world_building_id: pick.world_building_id,
			building_condition_id: c.building_condition_id,
			condition_id: c.condition_id,
			value: c.value,
			created_at: new Date().toISOString(),
			deleted_at: null,
		}));

		worldStore.update((state) =>
			produce(state, (draft) => {
				const world = draft.data[pick.world_id];
				if (world) {
					for (const condition of worldBuildingConditions) {
						world.worldBuildingConditions[condition.id] = condition;
					}
				}
			})
		);

		return worldBuildingConditions;
	}

	function createWorldItem(
		pick: Pick<WorldItem, 'world_id' | 'item_id' | 'world_character_id' | 'x' | 'y'> &
			Partial<
				Pick<
					WorldItem,
					| 'id'
					| 'created_at'
					| 'created_at_tick'
					| 'world_building_id'
					| 'durability_ticks'
					| 'rotation'
				>
			>
	): WorldItem {
		const { player, playerScenario, tickStore } = requireCurrentContext();

		const worldItem: WorldItem = {
			id: pick.id ?? (crypto.randomUUID() as WorldItemId),
			world_id: pick.world_id,
			item_id: pick.item_id,
			player_id: player.id,
			scenario_id: playerScenario.scenario_id,
			user_id: player.user_id,
			world_building_id: pick.world_building_id ?? null,
			world_character_id: pick.world_character_id,
			durability_ticks: pick.durability_ticks ?? null,
			rotation: pick.rotation ?? 0,
			x: pick.x,
			y: pick.y,
			created_at: pick.created_at ?? new Date().toISOString(),
			created_at_tick: pick.created_at_tick ?? get(tickStore),
			deleted_at: null,
		};

		worldStore.update((state) =>
			produce(state, (draft) => {
				const world = draft.data[pick.world_id];
				if (world) {
					world.worldItems[worldItem.id] = worldItem;
				}
			})
		);

		return worldItem;
	}

	function createWorldTileMap(
		pick: Pick<WorldTileMap, 'world_id' | 'terrain_id'> & Partial<Pick<WorldTileMap, 'data'>>,
		ctxOverride?: EntityContext
	): WorldTileMap {
		let ctx: EntityContext;
		if (ctxOverride) {
			ctx = ctxOverride;
		} else {
			const { player, playerScenario } = requireCurrentContext();
			ctx = { user_id: player.user_id, player_id: player.id, scenario_id: playerScenario.scenario_id };
		}

		const worldTileMap: WorldTileMap = {
			id: crypto.randomUUID(),
			world_id: pick.world_id,
			terrain_id: pick.terrain_id,
			player_id: ctx.player_id,
			scenario_id: ctx.scenario_id,
			user_id: ctx.user_id,
			data: pick.data ?? {},
			created_at: new Date().toISOString(),
			deleted_at: null,
		};

		worldStore.update((state) =>
			produce(state, (draft) => {
				const world = draft.data[pick.world_id];
				if (world) {
					world.worldTileMap = worldTileMap;
				}
			})
		);

		return worldTileMap;
	}

	// ============================================================
	// Store CRUD - Delete
	// ============================================================
	function deleteWorld(worldId: WorldId): void {
		worldStore.update((state) => {
			const newData = { ...state.data };
			delete newData[worldId];
			return { ...state, data: newData };
		});
	}

	function deleteWorldCharacter(id: WorldCharacterId): void {
		worldStore.update((state) =>
			produce(state, (draft) => {
				for (const world of Object.values(draft.data)) {
					if (world.worldCharacters[id]) {
						delete world.worldCharacters[id];
						return;
					}
				}
			})
		);
	}

	function deleteWorldCharacterNeedsByCharacter(worldCharacterId: WorldCharacterId): void {
		worldStore.update((state) =>
			produce(state, (draft) => {
				for (const world of Object.values(draft.data)) {
					for (const [id, need] of Object.entries(world.worldCharacterNeeds)) {
						if (need?.world_character_id === worldCharacterId) {
							delete world.worldCharacterNeeds[id as WorldCharacterNeedId];
						}
					}
				}
			})
		);
	}

	function deleteWorldBuilding(id: WorldBuildingId): void {
		worldStore.update((state) =>
			produce(state, (draft) => {
				for (const world of Object.values(draft.data)) {
					if (world.worldBuildings[id]) {
						delete world.worldBuildings[id];
						return;
					}
				}
			})
		);
	}

	function deleteWorldBuildingConditionsByBuilding(worldBuildingId: WorldBuildingId): void {
		worldStore.update((state) =>
			produce(state, (draft) => {
				for (const world of Object.values(draft.data)) {
					for (const [id, condition] of Object.entries(world.worldBuildingConditions)) {
						if (condition?.world_building_id === worldBuildingId) {
							delete world.worldBuildingConditions[id as WorldBuildingConditionId];
						}
					}
				}
			})
		);
	}

	function deleteWorldItem(id: WorldItemId): void {
		worldStore.update((state) =>
			produce(state, (draft) => {
				for (const world of Object.values(draft.data)) {
					if (world.worldItems[id]) {
						delete world.worldItems[id];
						return;
					}
				}
			})
		);
	}

	function deleteWorldTileMap(worldId: WorldId): void {
		worldStore.update((state) =>
			produce(state, (draft) => {
				const world = draft.data[worldId];
				if (world) {
					world.worldTileMap = undefined;
				}
			})
		);
	}

	// ============================================================
	// Store CRUD - Tile data operations
	// ============================================================
	function addTilesToWorldTileMap(
		worldId: WorldId,
		tiles: Record<TileCellKey, { tile_id: TileId; durability: number }>
	): void {
		worldStore.update((state) =>
			produce(state, (draft) => {
				const world = draft.data[worldId];
				if (world?.worldTileMap) {
					for (const [tileCellKey, data] of Object.entries(tiles)) {
						world.worldTileMap.data[tileCellKey as TileCellKey] = data;
					}
				}
			})
		);
	}

	function deleteTileFromWorldTileMapData(worldId: WorldId, tileCellKey: TileCellKey): void {
		worldStore.update((state) =>
			produce(state, (draft) => {
				const world = draft.data[worldId];
				if (world?.worldTileMap) {
					delete world.worldTileMap.data[tileCellKey];
				}
			})
		);
	}

	// ============================================================
	// Entity utilities
	// ============================================================

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

	// ============================================================
	// Fetch & Snapshot
	// ============================================================
	async function fetch() {
		if (!initialized) {
			throw new Error('useWorld not initialized. Call init() first.');
		}

		worldStore.update((state) => ({ ...state, status: 'loading' as const }));

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

			const dataRecord: Record<WorldId, WorldData> = {};

			for (const world of worldData ?? []) {
				const snapshot = world.snapshot as WorldSnapshot | null;
				const snapshotWorld = snapshot?.worlds?.[world.id as WorldId];
				// DB의 snapshot 필드를 제외하고 WorldData 구성
				const { snapshot: _snapshot, ...worldWithoutSnapshot } = world as World;

				const worldDataEntry: WorldData = {
					...worldWithoutSnapshot,
					worldCharacters: snapshotWorld?.worldCharacters ?? {},
					worldCharacterNeeds: snapshotWorld?.worldCharacterNeeds ?? {},
					worldBuildings: snapshotWorld?.worldBuildings ?? {},
					worldBuildingConditions: snapshotWorld?.worldBuildingConditions ?? {},
					worldItems: snapshotWorld?.worldItems ?? {},
					worldTileMap: snapshotWorld?.worldTileMap ?? undefined,
				};

				dataRecord[world.id as WorldId] = worldDataEntry;
			}

			worldStore.set({
				status: 'success',
				data: dataRecord,
				error: undefined,
			});
		} catch (error) {
			console.error('Failed to fetch world:', error);
			worldStore.update((state) => ({
				...state,
				status: 'error' as const,
				error: error instanceof Error ? error : new Error(String(error)),
			}));
		}
	}

	/**
	 * 특정 월드의 현재 스토어 상태를 WorldSnapshot으로 빌드
	 */
	function buildSnapshot(worldId: WorldId): WorldSnapshot {
		const state = get(worldStore);
		const worldData = state.data[worldId];

		const { playerStore, tickStore } = useCurrent();
		const player = get(playerStore);
		const { playerScenarioStore: playerScenarioAllStore } = usePlayer();
		const currentTick = get(tickStore);

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

		if (!player) {
			throw new Error('buildSnapshot: player가 초기화되지 않았습니다.');
		}

		return {
			worlds: worldData ? { [worldId]: worldData } : {},
			player,
			playerScenario: finalPlayerScenario,
		};
	}

	/**
	 * 월드 스냅샷을 빌드하여 DB에 저장한다.
	 */
	async function updateWorld(worldId: WorldId): Promise<void> {
		const snapshot = buildSnapshot(worldId);

		const { error } = await supabase
			.from('worlds')
			.update({
				snapshot: JSON.parse(JSON.stringify(snapshot)),
				updated_at: new Date().toISOString(),
			})
			.eq('id', worldId);

		if (error) {
			console.error('Failed to update world:', error);
			throw error;
		}
	}

	return {
		worldStore,
		selectedEntityIdStore,
		init,
		fetch,
		buildSnapshot,
		updateWorld,
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
		createWorld,
		createWorldCharacter,
		createWorldCharacterNeeds,
		createWorldBuilding,
		createWorldBuildingConditions,
		createWorldItem,
		createWorldTileMap,
		deleteWorld,
		deleteWorldCharacter,
		deleteWorldCharacterNeedsByCharacter,
		deleteWorldBuilding,
		deleteWorldBuildingConditionsByBuilding,
		deleteWorldItem,
		deleteWorldTileMap,
		addTilesToWorldTileMap,
		deleteTileFromWorldTileMapData,
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

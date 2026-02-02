import { writable, get } from 'svelte/store';
import { produce } from 'immer';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { InteractionIdUtils } from '$lib/utils/interaction-id';
import { useBuilding } from '$lib/hooks/use-building';
import { useItem } from '$lib/hooks/use-item';
import { useCharacter } from '$lib/hooks/use-character';
import type {
	RecordFetchState,
	World,
	WorldCharacter,
	WorldCharacterNeed,
	WorldBuilding,
	WorldBuildingCondition,
	WorldItem,
	WorldTileMap,
	WorldId,
	WorldCharacterId,
	WorldCharacterNeedId,
	WorldBuildingId,
	WorldBuildingConditionId,
	WorldItemId,
	EntityId,
	EntityType,
	EntityInstance,
	EntitySourceId,
	BehaviorAction,
	Interaction,
	InteractionAction,
} from '$lib/types';
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

	// Getter functions
	function getWorld(id: string): World | undefined {
		return get(worldStore).data[id as WorldId];
	}

	function getWorldCharacter(id: string): WorldCharacter | undefined {
		return get(worldCharacterStore).data[id as WorldCharacterId];
	}

	function getWorldCharacterNeed(id: string): WorldCharacterNeed | undefined {
		return get(worldCharacterNeedStore).data[id as WorldCharacterNeedId];
	}

	function getWorldBuilding(id: string): WorldBuilding | undefined {
		return get(worldBuildingStore).data[id as WorldBuildingId];
	}

	function getWorldBuildingCondition(id: string): WorldBuildingCondition | undefined {
		return get(worldBuildingConditionStore).data[id as WorldBuildingConditionId];
	}

	function getWorldItem(id: string): WorldItem | undefined {
		return get(worldItemStore).data[id as WorldItemId];
	}

	function getWorldTileMap(worldId: string): WorldTileMap | undefined {
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

	/**
	 * EntityId로부터 EntityInstance를 반환
	 */
	function getEntityInstance(entityId: EntityId): EntityInstance | undefined {
		const { type, instanceId } = EntityIdUtils.parse(entityId);

		if (type === 'building') {
			const entity = getWorldBuilding(instanceId);
			return entity ? EntityIdUtils.to(entity) : undefined;
		} else if (type === 'item') {
			const entity = getWorldItem(instanceId);
			return entity ? EntityIdUtils.to(entity) : undefined;
		} else if (type === 'character') {
			const entity = getWorldCharacter(instanceId);
			return entity ? EntityIdUtils.to(entity) : undefined;
		}
		return undefined;
	}

	/**
	 * EntityInstance로부터 템플릿 ID를 추출
	 */
	function getEntitySourceId(entityInstance: EntityInstance): EntitySourceId {
		if (entityInstance.entityType === 'building') {
			return entityInstance.building_id;
		} else if (entityInstance.entityType === 'item') {
			return entityInstance.item_id;
		} else if (entityInstance.entityType === 'character') {
			return entityInstance.character_id;
		} else {
			return entityInstance.id;
		}
	}

	/**
	 * BehaviorAction으로부터 Interaction을 반환
	 */
	function getInteraction(action: BehaviorAction): Interaction | undefined {
		const { getBuildingInteraction } = useBuilding();
		const { getItemInteraction } = useItem();
		const { getCharacterInteraction } = useCharacter();

		if (action.building_interaction_id) {
			const interaction = getBuildingInteraction(action.building_interaction_id);
			return interaction ? InteractionIdUtils.interaction.to(interaction) : undefined;
		} else if (action.item_interaction_id) {
			const interaction = getItemInteraction(action.item_interaction_id);
			return interaction ? InteractionIdUtils.interaction.to(interaction) : undefined;
		} else if (action.character_interaction_id) {
			const interaction = getCharacterInteraction(action.character_interaction_id);
			return interaction ? InteractionIdUtils.interaction.to(interaction) : undefined;
		}
		return undefined;
	}

	/**
	 * Interaction으로부터 InteractionAction 배열을 반환
	 */
	function getInteractionActions(interaction: Interaction): InteractionAction[] {
		const { getBuildingInteractionActions } = useBuilding();
		const { getItemInteractionActions } = useItem();
		const { getCharacterInteractionActions } = useCharacter();

		if (interaction.interactionType === 'building') {
			const actions = getBuildingInteractionActions(interaction.id) || [];
			return actions.map((a) => InteractionIdUtils.interactionAction.to(a));
		} else if (interaction.interactionType === 'item') {
			const actions = getItemInteractionActions(interaction.id) || [];
			return actions.map((a) => InteractionIdUtils.interactionAction.to(a));
		} else if (interaction.interactionType === 'character') {
			const actions = getCharacterInteractionActions(interaction.id) || [];
			return actions.map((a) => InteractionIdUtils.interactionAction.to(a));
		}
		return [];
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

			// 모든 데이터를 병렬로 조회
			const [
				{ data: worldData, error: worldError },
				{ data: characterData, error: characterError },
				{ data: characterNeedData, error: characterNeedError },
				{ data: buildingData, error: buildingError },
				{ data: buildingConditionData, error: buildingConditionError },
				{ data: itemData, error: itemError },
				{ data: tileMapData, error: tileMapError },
			] = await Promise.all([
				supabase.from('worlds').select('*').eq('player_id', player.id),
				supabase.from('world_characters').select('*').eq('player_id', player.id),
				supabase.from('world_character_needs').select('*').eq('player_id', player.id),
				supabase.from('world_buildings').select('*').eq('player_id', player.id),
				supabase.from('world_building_conditions').select('*').eq('player_id', player.id),
				supabase.from('world_items').select('*').eq('player_id', player.id),
				supabase.from('world_tile_maps').select('*').eq('player_id', player.id),
			]);

			if (worldError) throw worldError;
			if (characterError) throw characterError;
			if (characterNeedError) throw characterNeedError;
			if (buildingError) throw buildingError;
			if (buildingConditionError) throw buildingConditionError;
			if (itemError) throw itemError;
			if (tileMapError) throw tileMapError;

			// World 데이터 변환
			const worldRecord: Record<WorldId, World> = {};
			for (const world of worldData ?? []) {
				worldRecord[world.id as WorldId] = world as World;
			}

			worldStore.update((state) =>
				produce(state, (draft) => {
					draft.status = 'success';
					draft.data = worldRecord;
					draft.error = undefined;
				})
			);

			// WorldCharacter 데이터 변환
			const characterRecord: Record<WorldCharacterId, WorldCharacter> = {};
			for (const character of characterData ?? []) {
				characterRecord[character.id as WorldCharacterId] = character as WorldCharacter;
			}

			worldCharacterStore.update((state) =>
				produce(state, (draft) => {
					draft.status = 'success';
					draft.data = characterRecord;
					draft.error = undefined;
				})
			);

			// WorldCharacterNeed 데이터 변환
			const characterNeedRecord: Record<WorldCharacterNeedId, WorldCharacterNeed> = {};
			for (const need of characterNeedData ?? []) {
				characterNeedRecord[need.id as WorldCharacterNeedId] = need as WorldCharacterNeed;
			}

			worldCharacterNeedStore.update((state) =>
				produce(state, (draft) => {
					draft.status = 'success';
					draft.data = characterNeedRecord;
					draft.error = undefined;
				})
			);

			// WorldBuilding 데이터 변환
			const buildingRecord: Record<WorldBuildingId, WorldBuilding> = {};
			for (const building of buildingData ?? []) {
				buildingRecord[building.id as WorldBuildingId] = building as WorldBuilding;
			}

			worldBuildingStore.update((state) =>
				produce(state, (draft) => {
					draft.status = 'success';
					draft.data = buildingRecord;
					draft.error = undefined;
				})
			);

			// WorldBuildingCondition 데이터 변환
			const buildingConditionRecord: Record<WorldBuildingConditionId, WorldBuildingCondition> = {};
			for (const condition of buildingConditionData ?? []) {
				buildingConditionRecord[condition.id as WorldBuildingConditionId] =
					condition as WorldBuildingCondition;
			}

			worldBuildingConditionStore.update((state) =>
				produce(state, (draft) => {
					draft.status = 'success';
					draft.data = buildingConditionRecord;
					draft.error = undefined;
				})
			);

			// WorldItem 데이터 변환
			const itemRecord: Record<WorldItemId, WorldItem> = {};
			for (const item of itemData ?? []) {
				itemRecord[item.id as WorldItemId] = item as WorldItem;
			}

			worldItemStore.update((state) =>
				produce(state, (draft) => {
					draft.status = 'success';
					draft.data = itemRecord;
					draft.error = undefined;
				})
			);

			// WorldTileMap 데이터 변환
			const tileMapRecord: Record<WorldId, WorldTileMap> = {};
			for (const tileMap of tileMapData ?? []) {
				tileMapRecord[tileMap.world_id as WorldId] = tileMap as WorldTileMap;
			}

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
		setSelectedEntityId,
		getWorld,
		getWorldCharacter,
		getWorldCharacterNeed,
		getWorldBuilding,
		getWorldBuildingCondition,
		getWorldItem,
		getWorldTileMap,
		getAllWorlds,
		getAllWorldCharacters,
		getAllWorldCharacterNeeds,
		getAllWorldBuildings,
		getAllWorldBuildingConditions,
		getAllWorldItems,
		getAllWorldTileMaps,
		getEntityInstance,
		getEntitySourceId,
		getInteraction,
		getInteractionActions,
	};
}

export function useWorld() {
	if (!instance) {
		instance = createWorldStore();
	}
	return instance;
}

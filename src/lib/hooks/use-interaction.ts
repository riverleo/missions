import { writable, derived, get } from 'svelte/store';
import { produce } from 'immer';
import { InteractionIdUtils } from '$lib/utils/interaction-id';
import { EntityIdUtils } from '$lib/utils/entity-id';
import type {
	Database,
	RecordFetchState,
	Interaction,
	InteractionId,
	InteractionActionId,
	BuildingInteraction,
	BuildingInteractionId,
	BuildingInteractionInsert,
	BuildingInteractionUpdate,
	BuildingInteractionAction,
	BuildingInteractionActionId,
	BuildingInteractionActionInsert,
	BuildingInteractionActionUpdate,
	ItemInteraction,
	ItemInteractionId,
	ItemInteractionInsert,
	ItemInteractionUpdate,
	ItemInteractionAction,
	ItemInteractionActionId,
	ItemInteractionActionInsert,
	ItemInteractionActionUpdate,
	CharacterInteraction,
	CharacterInteractionId,
	CharacterInteractionInsert,
	CharacterInteractionUpdate,
	CharacterInteractionAction,
	CharacterInteractionActionId,
	CharacterInteractionActionInsert,
	CharacterInteractionActionUpdate,
	ScenarioId,
	InteractionAction,
	BehaviorAction,
	EntityId,
	EntitySourceId,
	BehaviorInteractionType,
	InteractionType,
} from '$lib/types';
import { useApp } from './use-app.svelte';

type BuildingInteractionDialogState =
	| { type: 'create' }
	| { type: 'update'; buildingInteractionId: BuildingInteractionId }
	| { type: 'delete'; buildingInteractionId: BuildingInteractionId }
	| undefined;

type ItemInteractionDialogState =
	| { type: 'create' }
	| { type: 'update'; itemInteractionId: ItemInteractionId }
	| { type: 'delete'; itemInteractionId: ItemInteractionId }
	| undefined;

type CharacterInteractionDialogState =
	| { type: 'create' }
	| { type: 'update'; characterInteractionId: CharacterInteractionId }
	| { type: 'delete'; characterInteractionId: CharacterInteractionId }
	| undefined;

let instance: ReturnType<typeof createInteractionStore> | null = null;

function createInteractionStore() {
	const { supabase } = useApp();

	// ===== Stores =====
	const buildingInteractionStore = writable<
		RecordFetchState<BuildingInteractionId, BuildingInteraction>
	>({
		status: 'idle',
		data: {},
	});

	const buildingInteractionActionStore = writable<
		RecordFetchState<BuildingInteractionId, BuildingInteractionAction[]>
	>({
		status: 'idle',
		data: {},
	});

	const itemInteractionStore = writable<RecordFetchState<ItemInteractionId, ItemInteraction>>({
		status: 'idle',
		data: {},
	});

	const itemInteractionActionStore = writable<
		RecordFetchState<ItemInteractionId, ItemInteractionAction[]>
	>({
		status: 'idle',
		data: {},
	});

	const characterInteractionStore = writable<
		RecordFetchState<CharacterInteractionId, CharacterInteraction>
	>({
		status: 'idle',
		data: {},
	});

	const characterInteractionActionStore = writable<
		RecordFetchState<CharacterInteractionId, CharacterInteractionAction[]>
	>({
		status: 'idle',
		data: {},
	});

	const buildingInteractionDialogStore = writable<BuildingInteractionDialogState>(undefined);
	const itemInteractionDialogStore = writable<ItemInteractionDialogState>(undefined);
	const characterInteractionDialogStore = writable<CharacterInteractionDialogState>(undefined);

	// ===== Derived Stores =====
	const allBuildingInteractionsStore = derived(buildingInteractionStore, ($store) =>
		Object.values($store.data)
	);

	const allItemInteractionsStore = derived(itemInteractionStore, ($store) =>
		Object.values($store.data)
	);

	const allCharacterInteractionsStore = derived(characterInteractionStore, ($store) =>
		Object.values($store.data)
	);

	const allInteractionsStore = derived(
		[buildingInteractionStore, itemInteractionStore, characterInteractionStore],
		([$building, $item, $character]) => [
			...(Object.values($building.data) as BuildingInteraction[]).map(
				InteractionIdUtils.interaction.to
			),
			...(Object.values($item.data) as ItemInteraction[]).map(InteractionIdUtils.interaction.to),
			...(Object.values($character.data) as CharacterInteraction[]).map(
				InteractionIdUtils.interaction.to
			),
		]
	);

	const allInteractionActionsStore = derived(
		[buildingInteractionActionStore, itemInteractionActionStore, characterInteractionActionStore],
		([$building, $item, $character]) => [
			...Object.values($building.data).flat().map(InteractionIdUtils.interactionAction.to),
			...Object.values($item.data).flat().map(InteractionIdUtils.interactionAction.to),
			...Object.values($character.data).flat().map(InteractionIdUtils.interactionAction.to),
		]
	);

	const onceInteractionsStore = derived(allInteractionsStore, ($all) =>
		$all.filter((i) => i.once_interaction_type !== null)
	);

	const fulfillInteractionsStore = derived(allInteractionsStore, ($all) =>
		$all.filter((i) => i.fulfill_interaction_type !== null)
	);

	// ===== Initialization & Fetch =====
	let initialized = false;

	function init() {
		initialized = true;
	}

	async function fetch() {
		if (!initialized) {
			throw new Error('useInteraction not initialized. Call init() first.');
		}

		buildingInteractionStore.update((state) => ({ ...state, status: 'loading' }));
		buildingInteractionActionStore.update((state) => ({ ...state, status: 'loading' }));
		itemInteractionStore.update((state) => ({ ...state, status: 'loading' }));
		itemInteractionActionStore.update((state) => ({ ...state, status: 'loading' }));
		characterInteractionStore.update((state) => ({ ...state, status: 'loading' }));
		characterInteractionActionStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			const [buildingResult, itemResult, characterResult] = await Promise.all([
				supabase
					.from('building_interactions')
					.select('*, building_interaction_actions(*)')
					.order('created_at'),
				supabase
					.from('item_interactions')
					.select('*, item_interaction_actions(*)')
					.order('created_at'),
				supabase
					.from('character_interactions')
					.select('*, character_interaction_actions(*)')
					.order('created_at'),
			]);

			if (buildingResult.error) throw buildingResult.error;
			if (itemResult.error) throw itemResult.error;
			if (characterResult.error) throw characterResult.error;

			// Building interactions and actions
			const buildingInteractionRecord: Record<BuildingInteractionId, BuildingInteraction> = {};
			const buildingActionRecord: Record<BuildingInteractionId, BuildingInteractionAction[]> = {};

			for (const item of buildingResult.data ?? []) {
				const { building_interaction_actions, ...interaction } = item;
				buildingInteractionRecord[item.id as BuildingInteractionId] =
					interaction as BuildingInteraction;
				buildingActionRecord[item.id as BuildingInteractionId] = (building_interaction_actions ??
					[]) as BuildingInteractionAction[];
			}

			// Item interactions and actions
			const itemInteractionRecord: Record<ItemInteractionId, ItemInteraction> = {};
			const itemActionRecord: Record<ItemInteractionId, ItemInteractionAction[]> = {};

			for (const item of itemResult.data ?? []) {
				const { item_interaction_actions, ...interaction } = item;
				itemInteractionRecord[item.id as ItemInteractionId] = interaction as ItemInteraction;
				itemActionRecord[item.id as ItemInteractionId] = (item_interaction_actions ??
					[]) as ItemInteractionAction[];
			}

			// Character interactions and actions
			const characterInteractionRecord: Record<CharacterInteractionId, CharacterInteraction> = {};
			const characterActionRecord: Record<CharacterInteractionId, CharacterInteractionAction[]> =
				{};

			for (const item of characterResult.data ?? []) {
				const { character_interaction_actions, ...interaction } = item;
				characterInteractionRecord[item.id as CharacterInteractionId] =
					interaction as CharacterInteraction;
				characterActionRecord[item.id as CharacterInteractionId] = (character_interaction_actions ??
					[]) as CharacterInteractionAction[];
			}

			buildingInteractionStore.set({
				status: 'success',
				data: buildingInteractionRecord,
				error: undefined,
			});
			buildingInteractionActionStore.set({
				status: 'success',
				data: buildingActionRecord,
				error: undefined,
			});
			itemInteractionStore.set({
				status: 'success',
				data: itemInteractionRecord,
				error: undefined,
			});
			itemInteractionActionStore.set({
				status: 'success',
				data: itemActionRecord,
				error: undefined,
			});
			characterInteractionStore.set({
				status: 'success',
				data: characterInteractionRecord,
				error: undefined,
			});
			characterInteractionActionStore.set({
				status: 'success',
				data: characterActionRecord,
				error: undefined,
			});
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			buildingInteractionStore.set({ status: 'error', data: {}, error: err });
			buildingInteractionActionStore.set({ status: 'error', data: {}, error: err });
			itemInteractionStore.set({ status: 'error', data: {}, error: err });
			itemInteractionActionStore.set({ status: 'error', data: {}, error: err });
			characterInteractionStore.set({ status: 'error', data: {}, error: err });
			characterInteractionActionStore.set({ status: 'error', data: {}, error: err });
		}
	}

	// ===== Dialog Management =====
	function openBuildingInteractionDialog(state: NonNullable<BuildingInteractionDialogState>) {
		buildingInteractionDialogStore.set(state);
	}

	function closeBuildingInteractionDialog() {
		buildingInteractionDialogStore.set(undefined);
	}

	function openItemInteractionDialog(state: NonNullable<ItemInteractionDialogState>) {
		itemInteractionDialogStore.set(state);
	}

	function closeItemInteractionDialog() {
		itemInteractionDialogStore.set(undefined);
	}

	function openCharacterInteractionDialog(state: NonNullable<CharacterInteractionDialogState>) {
		characterInteractionDialogStore.set(state);
	}

	function closeCharacterInteractionDialog() {
		characterInteractionDialogStore.set(undefined);
	}

	// ===== Getter Functions =====
	function getAllBuildingInteractions(): BuildingInteraction[] {
		return get(allBuildingInteractionsStore);
	}

	function getAllItemInteractions(): ItemInteraction[] {
		return get(allItemInteractionsStore);
	}

	function getAllCharacterInteractions(): CharacterInteraction[] {
		return get(allCharacterInteractionsStore);
	}

	function getAllInteractions(): Interaction[] {
		return get(allInteractionsStore);
	}

	function getAllInteractionActions(): InteractionAction[] {
		return get(allInteractionActionsStore);
	}

	function getOnceInteractions(): Interaction[] {
		return get(onceInteractionsStore);
	}

	function getFulfillInteractions(): Interaction[] {
		return get(fulfillInteractionsStore);
	}

	// Getter functions - throw if not found (required data)
	function getInteraction(id: string): Interaction;
	function getInteraction(
		entityId: EntityId,
		behaviorInteractionType: BehaviorInteractionType
	): Interaction;
	function getInteraction(
		idOrEntityId: string | EntityId,
		behaviorInteractionType?: BehaviorInteractionType
	): Interaction {
		if (behaviorInteractionType !== undefined) {
			// EntityId와 BehaviorInteractionType로 조회
			return getInteractionByType(behaviorInteractionType, idOrEntityId as EntityId);
		} else {
			// ID로 조회
			const data = getAllInteractions().find((i) => i.id === idOrEntityId);
			if (!data) throw new Error(`Interaction not found: ${idOrEntityId}`);
			return data;
		}
	}

	function getOrUndefinedInteraction(
		entityId: EntityId,
		behaviorInteractionType: BehaviorInteractionType
	): Interaction | undefined {
		return getOrUndefinedInteractionByType(behaviorInteractionType, entityId);
	}

	function getBuildingInteraction(id: string): BuildingInteraction {
		const data = getOrUndefinedBuildingInteraction(id);
		if (!data) throw new Error(`BuildingInteraction not found: ${id}`);
		return data;
	}

	function getItemInteraction(id: string): ItemInteraction {
		const data = get(itemInteractionStore).data[id as ItemInteractionId];
		if (!data) throw new Error(`ItemInteraction not found: ${id}`);
		return data;
	}

	function getCharacterInteraction(id: string): CharacterInteraction {
		const data = get(characterInteractionStore).data[id as CharacterInteractionId];
		if (!data) throw new Error(`CharacterInteraction not found: ${id}`);
		return data;
	}

	// Getter functions - return undefined if not found (optional data)
	function getOrUndefinedBuildingInteraction(
		id: string | null | undefined
	): BuildingInteraction | undefined {
		if (!id) return undefined;
		return get(buildingInteractionStore).data[id as BuildingInteractionId];
	}

	function getOrUndefinedItemInteraction(
		id: string | null | undefined
	): ItemInteraction | undefined {
		if (!id) return undefined;
		return get(itemInteractionStore).data[id as ItemInteractionId];
	}

	function getOrUndefinedCharacterInteraction(
		id: string | null | undefined
	): CharacterInteraction | undefined {
		if (!id) return undefined;
		return get(characterInteractionStore).data[id as CharacterInteractionId];
	}

	/**
	 * BehaviorAction으로부터 Interaction을 반환 (throw)
	 */
	function getInteractionByBehaviorAction(action: BehaviorAction): Interaction {
		const data = getOrUndefinedInteractionByBehaviorAction(action);
		if (!data) {
			throw new Error('No interaction ID found in BehaviorAction');
		}
		return data;
	}

	/**
	 * BehaviorAction으로부터 Interaction을 반환 (return undefined)
	 */
	function getOrUndefinedInteractionByBehaviorAction(
		action: BehaviorAction | null | undefined
	): Interaction | undefined {
		if (!action) return undefined;

		const interactionId =
			action.building_interaction_id ||
			action.item_interaction_id ||
			action.character_interaction_id;

		if (interactionId) {
			return getInteraction(interactionId);
		}
		return undefined;
	}

	/**
	 * BehaviorInteractionType과 EntityId/EntitySourceId로 Interaction을 반환 (throw)
	 */
	function getInteractionByType(
		behaviorInteractionType: BehaviorInteractionType,
		entityIdOrSourceId: EntityId | EntitySourceId
	): Interaction {
		const data = getOrUndefinedInteractionByType(behaviorInteractionType, entityIdOrSourceId);
		if (!data) {
			throw new Error(
				`Interaction not found: ${behaviorInteractionType} for ${entityIdOrSourceId}`
			);
		}
		return data;
	}

	/**
	 * BehaviorInteractionType과 EntityId/EntitySourceId로 Interaction을 반환 (return undefined)
	 */
	function getOrUndefinedInteractionByType(
		behaviorInteractionType: BehaviorInteractionType,
		entityIdOrSourceId: EntityId | EntitySourceId
	): Interaction | undefined {
		let sourceId: EntitySourceId;
		let entityType: 'building' | 'item' | 'character';

		// EntityId인지 확인
		if (EntityIdUtils.or(['building', 'item', 'character'], entityIdOrSourceId as EntityId)) {
			// EntityId
			const parsed = EntityIdUtils.parse(entityIdOrSourceId as EntityId);
			sourceId = parsed.sourceId;
			entityType = parsed.type as 'building' | 'item' | 'character';
		} else {
			// EntitySourceId
			sourceId = entityIdOrSourceId as EntitySourceId;
			// BehaviorInteractionType에서 entityType 추출 (예: 'item_use' -> 'item')
			const typePrefix = behaviorInteractionType.split('_')[0];
			if (typePrefix === 'building' || typePrefix === 'item' || typePrefix === 'character') {
				entityType = typePrefix;
			} else {
				throw new Error(`Invalid BehaviorInteractionType: ${behaviorInteractionType}`);
			}
		}

		// 캐싱된 모든 인터랙션에서 검색
		const interactions = getAllInteractions();
		return interactions.find((i) => {
			// entitySourceType과 sourceId 확인
			const isMatchingSource =
				(i.entitySourceType === 'building' && 'building_id' in i && i.building_id === sourceId) ||
				(i.entitySourceType === 'item' && 'item_id' in i && i.item_id === sourceId) ||
				(i.entitySourceType === 'character' && 'character_id' in i && i.character_id === sourceId);

			// BehaviorInteractionType 확인
			const isMatchingType =
				i.once_interaction_type === behaviorInteractionType ||
				i.fulfill_interaction_type === behaviorInteractionType ||
				i.system_interaction_type === behaviorInteractionType;

			return i.entitySourceType === entityType && isMatchingSource && isMatchingType;
		});
	}

	function getAllBuildingInteractionActions(
		buildingInteractionId: BuildingInteractionId
	): BuildingInteractionAction[] {
		return get(buildingInteractionActionStore).data[buildingInteractionId] ?? [];
	}

	function getAllItemInteractionActions(
		itemInteractionId: ItemInteractionId
	): ItemInteractionAction[] {
		return get(itemInteractionActionStore).data[itemInteractionId] ?? [];
	}

	function getAllCharacterInteractionActions(
		characterInteractionId: CharacterInteractionId
	): CharacterInteractionAction[] {
		return get(characterInteractionActionStore).data[characterInteractionId] ?? [];
	}

	/**
	 * Interaction으로부터 InteractionAction 배열을 반환
	 */
	function getAllInteractionActionsByInteraction(interaction: Interaction): InteractionAction[] {
		return getAllInteractionActions().filter((action) => {
			if ('building_interaction_id' in action) {
				return action.building_interaction_id === interaction.id;
			} else if ('item_interaction_id' in action) {
				return action.item_interaction_id === interaction.id;
			} else if ('character_interaction_id' in action) {
				return action.character_interaction_id === interaction.id;
			}
			return false;
		});
	}

	/**
	 * Interaction으로부터 root InteractionAction을 반환 (throw)
	 */
	function getRootInteractionAction(interaction: Interaction): InteractionAction;
	function getRootInteractionAction(
		entityId: EntityId,
		behaviorInteractionType: BehaviorInteractionType
	): InteractionAction;
	function getRootInteractionAction(
		interactionOrEntityId: Interaction | EntityId,
		behaviorInteractionType?: BehaviorInteractionType
	): InteractionAction {
		if (behaviorInteractionType !== undefined) {
			// EntityId와 BehaviorInteractionType로 조회
			const interaction = getInteraction(
				interactionOrEntityId as EntityId,
				behaviorInteractionType
			);
			const data = getOrUndefinedRootInteractionAction(interaction);
			if (!data) {
				throw new Error(
					`Root InteractionAction not found for entity ${interactionOrEntityId} with type ${behaviorInteractionType}`
				);
			}
			return data;
		} else {
			// Interaction으로 조회
			const data = getOrUndefinedRootInteractionAction(interactionOrEntityId as Interaction);
			if (!data) {
				throw new Error(
					`Root InteractionAction not found for interaction: ${(interactionOrEntityId as Interaction).id}`
				);
			}
			return data;
		}
	}

	/**
	 * Interaction으로부터 root InteractionAction을 반환 (return undefined)
	 */
	function getOrUndefinedRootInteractionAction(
		interaction: Interaction | null | undefined
	): InteractionAction | undefined;
	function getOrUndefinedRootInteractionAction(
		entityId: EntityId,
		behaviorInteractionType: BehaviorInteractionType
	): InteractionAction | undefined;
	function getOrUndefinedRootInteractionAction(
		interactionOrEntityId: Interaction | EntityId | null | undefined,
		behaviorInteractionType?: BehaviorInteractionType
	): InteractionAction | undefined {
		if (behaviorInteractionType !== undefined) {
			// EntityId와 BehaviorInteractionType로 조회
			const interaction = getOrUndefinedInteraction(
				interactionOrEntityId as EntityId,
				behaviorInteractionType
			);
			if (!interaction) return undefined;
			const actions = getAllInteractionActionsByInteraction(interaction);
			return actions.find((action) => action.root);
		} else {
			// Interaction으로 조회
			const interaction = interactionOrEntityId as Interaction | null | undefined;
			if (!interaction) return undefined;
			const actions = getAllInteractionActionsByInteraction(interaction);
			return actions.find((action) => action.root);
		}
	}

	/**
	 * EntityId에 해당하는 엔티티의 모든 Interaction 반환
	 * @example
	 * const interactions = getAllInteractionsByEntityId(entityId);
	 */
	function getAllInteractionsByEntityId(entityId: EntityId): Interaction[] {
		const entityType = EntityIdUtils.type(entityId);
		const sourceId = EntityIdUtils.sourceId(entityId);

		return getAllInteractions().filter((interaction) => {
			if (interaction.entitySourceType !== entityType) {
				return false;
			}

			if (interaction.entitySourceType === 'building') {
				return interaction.building_id === sourceId;
			} else if (interaction.entitySourceType === 'item') {
				return interaction.item_id === sourceId;
			} else if (interaction.entitySourceType === 'character') {
				return interaction.character_id === sourceId;
			}

			return false;
		});
	}

	function getNextInteractionActionId(
		interactionAction: InteractionAction
	): InteractionActionId | undefined {
		if ('next_building_interaction_action_id' in interactionAction) {
			return interactionAction.next_building_interaction_action_id ?? undefined;
		} else if ('next_item_interaction_action_id' in interactionAction) {
			return interactionAction.next_item_interaction_action_id ?? undefined;
		} else if ('next_character_interaction_action_id' in interactionAction) {
			return interactionAction.next_character_interaction_action_id ?? undefined;
		}
		return undefined;
	}

	function getNextInteractionAction(
		interactionAction: InteractionAction
	): InteractionAction | undefined {
		const nextActionId = getNextInteractionActionId(interactionAction);
		if (!nextActionId) return undefined;

		return getAllInteractionActions().find((action) => action.id === nextActionId);
	}

	function isFirstBuildingInteractionAction(buildingInteractionId: BuildingInteractionId): boolean {
		const actions = get(buildingInteractionActionStore).data[buildingInteractionId] ?? [];
		return actions.length === 0;
	}

	function isFirstItemInteractionAction(itemInteractionId: ItemInteractionId): boolean {
		const actions = get(itemInteractionActionStore).data[itemInteractionId] ?? [];
		return actions.length === 0;
	}

	function isFirstCharacterInteractionAction(
		characterInteractionId: CharacterInteractionId
	): boolean {
		const actions = get(characterInteractionActionStore).data[characterInteractionId] ?? [];
		return actions.length === 0;
	}


	// ===== Admin CRUD - Building Interactions =====
	const admin = {
		// Building Interaction
		async createBuildingInteraction(
			scenarioId: ScenarioId,
			interaction: Omit<BuildingInteractionInsert, 'scenario_id'>
		) {
			const { data, error } = await supabase
				.from('building_interactions')
				.insert({
					scenario_id: scenarioId,
					...interaction,
				} as Database['public']['Tables']['building_interactions']['Insert'])
				.select('*')
				.single<BuildingInteraction>();

			if (error) throw error;

			buildingInteractionStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as BuildingInteractionId] = data;
				})
			);

			buildingInteractionActionStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as BuildingInteractionId] = [];
				})
			);

			await admin.createBuildingInteractionAction(scenarioId, data.id as BuildingInteractionId, {});

			return data;
		},

		async updateBuildingInteraction(id: BuildingInteractionId, updates: BuildingInteractionUpdate) {
			const { error } = await supabase.from('building_interactions').update(updates).eq('id', id);

			if (error) throw error;

			buildingInteractionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], updates);
					}
				})
			);
		},

		async removeBuildingInteraction(id: BuildingInteractionId) {
			const { error } = await supabase.from('building_interactions').delete().eq('id', id);

			if (error) throw error;

			buildingInteractionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);

			buildingInteractionActionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);
		},

		async createBuildingInteractionAction(
			scenarioId: ScenarioId,
			buildingInteractionId: BuildingInteractionId,
			action: Omit<
				BuildingInteractionActionInsert,
				'scenario_id' | 'building_id' | 'building_interaction_id' | 'root'
			>
		) {
			const buildingInteractionStoreValue = get(buildingInteractionStore);
			const buildingId =
				buildingInteractionStoreValue.data[buildingInteractionId]?.building_id || null;
			const root = isFirstBuildingInteractionAction(buildingInteractionId);

			const { data, error } = await supabase
				.from('building_interaction_actions')
				.insert({
					...action,
					root,
					scenario_id: scenarioId,
					building_id: buildingId,
					building_interaction_id: buildingInteractionId,
				})
				.select()
				.single<BuildingInteractionAction>();

			if (error) throw error;

			buildingInteractionActionStore.update((s) =>
				produce(s, (draft) => {
					if (draft.data[buildingInteractionId]) {
						draft.data[buildingInteractionId].push(data);
					} else {
						draft.data[buildingInteractionId] = [data];
					}
				})
			);

			return data;
		},

		async updateBuildingInteractionAction(
			id: BuildingInteractionActionId,
			updates: BuildingInteractionActionUpdate
		) {
			const { error } = await supabase
				.from('building_interaction_actions')
				.update(updates)
				.eq('id', id);

			if (error) throw error;

			buildingInteractionActionStore.update((state) =>
				produce(state, (draft) => {
					for (const actions of Object.values(draft.data)) {
						const action = actions.find((a) => a.id === id);
						if (action) {
							Object.assign(action, updates);
							break;
						}
					}
				})
			);
		},

		async removeBuildingInteractionAction(id: BuildingInteractionActionId) {
			const { error } = await supabase.from('building_interaction_actions').delete().eq('id', id);

			if (error) throw error;

			buildingInteractionActionStore.update((state) =>
				produce(state, (draft) => {
					for (const key of Object.keys(draft.data)) {
						const actions = draft.data[key as BuildingInteractionId];
						if (actions) {
							const index = actions.findIndex((a) => a.id === id);
							if (index !== -1) {
								actions.splice(index, 1);
								break;
							}
						}
					}
				})
			);
		},

		// Item Interaction
		async createItemInteraction(
			scenarioId: ScenarioId,
			interaction: Omit<ItemInteractionInsert, 'scenario_id'>
		) {
			const { data, error } = await supabase
				.from('item_interactions')
				.insert({
					scenario_id: scenarioId,
					...interaction,
				} as Database['public']['Tables']['item_interactions']['Insert'])
				.select('*')
				.single<ItemInteraction>();

			if (error) throw error;

			itemInteractionStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as ItemInteractionId] = data;
				})
			);

			itemInteractionActionStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as ItemInteractionId] = [];
				})
			);

			await admin.createItemInteractionAction(scenarioId, data.id as ItemInteractionId, {});

			return data;
		},

		async updateItemInteraction(id: ItemInteractionId, updates: ItemInteractionUpdate) {
			const { error } = await supabase.from('item_interactions').update(updates).eq('id', id);

			if (error) throw error;

			itemInteractionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], updates);
					}
				})
			);
		},

		async removeItemInteraction(id: ItemInteractionId) {
			const { error } = await supabase.from('item_interactions').delete().eq('id', id);

			if (error) throw error;

			itemInteractionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);

			itemInteractionActionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);
		},

		async createItemInteractionAction(
			scenarioId: ScenarioId,
			itemInteractionId: ItemInteractionId,
			action: Omit<
				ItemInteractionActionInsert,
				'scenario_id' | 'item_id' | 'item_interaction_id' | 'root'
			>
		) {
			const itemInteractionStoreValue = get(itemInteractionStore);
			const itemId = itemInteractionStoreValue.data[itemInteractionId]?.item_id || null;
			const root = isFirstItemInteractionAction(itemInteractionId);

			const { data, error } = await supabase
				.from('item_interaction_actions')
				.insert({
					...action,
					root,
					scenario_id: scenarioId,
					item_id: itemId,
					item_interaction_id: itemInteractionId,
				})
				.select()
				.single<ItemInteractionAction>();

			if (error) throw error;

			itemInteractionActionStore.update((s) =>
				produce(s, (draft) => {
					if (draft.data[itemInteractionId]) {
						draft.data[itemInteractionId].push(data);
					} else {
						draft.data[itemInteractionId] = [data];
					}
				})
			);

			return data;
		},

		async updateItemInteractionAction(
			id: ItemInteractionActionId,
			updates: ItemInteractionActionUpdate
		) {
			const { error } = await supabase
				.from('item_interaction_actions')
				.update(updates)
				.eq('id', id);

			if (error) throw error;

			itemInteractionActionStore.update((state) =>
				produce(state, (draft) => {
					for (const actions of Object.values(draft.data)) {
						const action = actions.find((a) => a.id === id);
						if (action) {
							Object.assign(action, updates);
							break;
						}
					}
				})
			);
		},

		async removeItemInteractionAction(id: ItemInteractionActionId) {
			const { error } = await supabase.from('item_interaction_actions').delete().eq('id', id);

			if (error) throw error;

			itemInteractionActionStore.update((state) =>
				produce(state, (draft) => {
					for (const key of Object.keys(draft.data)) {
						const actions = draft.data[key as ItemInteractionId];
						if (actions) {
							const index = actions.findIndex((a) => a.id === id);
							if (index !== -1) {
								actions.splice(index, 1);
								break;
							}
						}
					}
				})
			);
		},

		// Character Interaction
		async createCharacterInteraction(
			scenarioId: ScenarioId,
			interaction: Omit<CharacterInteractionInsert, 'scenario_id'>
		) {
			const { data, error } = await supabase
				.from('character_interactions')
				.insert({
					scenario_id: scenarioId,
					...interaction,
				} as Database['public']['Tables']['character_interactions']['Insert'])
				.select('*')
				.single<CharacterInteraction>();

			if (error) throw error;

			characterInteractionStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as CharacterInteractionId] = data;
				})
			);

			characterInteractionActionStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as CharacterInteractionId] = [];
				})
			);

			await admin.createCharacterInteractionAction(
				scenarioId,
				data.id as CharacterInteractionId,
				{}
			);

			return data;
		},

		async updateCharacterInteraction(
			id: CharacterInteractionId,
			updates: CharacterInteractionUpdate
		) {
			const { error } = await supabase.from('character_interactions').update(updates).eq('id', id);

			if (error) throw error;

			characterInteractionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], updates);
					}
				})
			);
		},

		async removeCharacterInteraction(id: CharacterInteractionId) {
			const { error } = await supabase.from('character_interactions').delete().eq('id', id);

			if (error) throw error;

			characterInteractionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);

			characterInteractionActionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);
		},

		async createCharacterInteractionAction(
			scenarioId: ScenarioId,
			characterInteractionId: CharacterInteractionId,
			action: Omit<
				CharacterInteractionActionInsert,
				'scenario_id' | 'character_id' | 'character_interaction_id' | 'root'
			>
		) {
			const characterInteractionStoreValue = get(characterInteractionStore);
			const characterId =
				characterInteractionStoreValue.data[characterInteractionId]?.character_id || null;
			const root = isFirstCharacterInteractionAction(characterInteractionId);

			const { data, error } = await supabase
				.from('character_interaction_actions')
				.insert({
					...action,
					root,
					scenario_id: scenarioId,
					character_id: characterId,
					character_interaction_id: characterInteractionId,
				})
				.select()
				.single<CharacterInteractionAction>();

			if (error) throw error;

			characterInteractionActionStore.update((s) =>
				produce(s, (draft) => {
					if (draft.data[characterInteractionId]) {
						draft.data[characterInteractionId].push(data);
					} else {
						draft.data[characterInteractionId] = [data];
					}
				})
			);

			return data;
		},

		async updateCharacterInteractionAction(
			id: CharacterInteractionActionId,
			updates: CharacterInteractionActionUpdate
		) {
			const { error } = await supabase
				.from('character_interaction_actions')
				.update(updates)
				.eq('id', id);

			if (error) throw error;

			characterInteractionActionStore.update((state) =>
				produce(state, (draft) => {
					for (const actions of Object.values(draft.data)) {
						const action = actions.find((a) => a.id === id);
						if (action) {
							Object.assign(action, updates);
							break;
						}
					}
				})
			);
		},

		async removeCharacterInteractionAction(id: CharacterInteractionActionId) {
			const { error } = await supabase.from('character_interaction_actions').delete().eq('id', id);

			if (error) throw error;

			characterInteractionActionStore.update((state) =>
				produce(state, (draft) => {
					for (const key of Object.keys(draft.data)) {
						const actions = draft.data[key as CharacterInteractionId];
						if (actions) {
							const index = actions.findIndex((a) => a.id === id);
							if (index !== -1) {
								actions.splice(index, 1);
								break;
							}
						}
					}
				})
			);
		},
	};

	return {
		// Stores
		buildingInteractionStore,
		buildingInteractionActionStore,
		itemInteractionStore,
		itemInteractionActionStore,
		characterInteractionStore,
		characterInteractionActionStore,
		buildingInteractionDialogStore,
		itemInteractionDialogStore,
		characterInteractionDialogStore,
		// Derived stores
		allBuildingInteractionsStore,
		allItemInteractionsStore,
		allCharacterInteractionsStore,
		allInteractionsStore,
		onceInteractionsStore,
		fulfillInteractionsStore,
		// Initialization
		init,
		fetch,
		// Dialog management
		openBuildingInteractionDialog,
		closeBuildingInteractionDialog,
		openItemInteractionDialog,
		closeItemInteractionDialog,
		openCharacterInteractionDialog,
		closeCharacterInteractionDialog,
		// Getters
		getAllBuildingInteractions,
		getAllItemInteractions,
		getAllCharacterInteractions,
		getAllInteractions,
		getOnceInteractions,
		getFulfillInteractions,
		getInteraction,
		getOrUndefinedInteraction,
		getBuildingInteraction,
		getItemInteraction,
		getCharacterInteraction,
		getOrUndefinedBuildingInteraction,
		getOrUndefinedItemInteraction,
		getOrUndefinedCharacterInteraction,
		getInteractionByBehaviorAction,
		getOrUndefinedInteractionByBehaviorAction,
		getInteractionByType,
		getOrUndefinedInteractionByType,
		getAllBuildingInteractionActions,
		getAllItemInteractionActions,
		getAllCharacterInteractionActions,
		getAllInteractionActions,
		getAllInteractionActionsByInteraction,
		getRootInteractionAction,
		getOrUndefinedRootInteractionAction,
		getAllInteractionsByEntityId,
		getNextInteractionActionId,
		getNextInteractionAction,
		// Admin
		admin,
	};
}

export function useInteraction() {
	if (!instance) {
		instance = createInteractionStore();
	}
	return instance;
}

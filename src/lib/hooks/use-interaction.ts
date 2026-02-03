import { writable, derived, get, type Readable } from 'svelte/store';
import { produce } from 'immer';
import { InteractionIdUtils } from '$lib/utils/interaction-id';
import type {
	Database,
	RecordFetchState,
	Interaction,
	InteractionId,
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

	const onceInteractionsStore = derived(allInteractionsStore, ($all) =>
		$all.filter((i) => i.once_interaction_type !== null)
	);

	const fulfillInteractionsStore = derived(allInteractionsStore, ($all) =>
		$all.filter((i) => i.repeat_interaction_type !== null)
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
			const characterActionRecord: Record<
				CharacterInteractionId,
				CharacterInteractionAction[]
			> = {};

			for (const item of characterResult.data ?? []) {
				const { character_interaction_actions, ...interaction } = item;
				characterInteractionRecord[item.id as CharacterInteractionId] =
					interaction as CharacterInteraction;
				characterActionRecord[item.id as CharacterInteractionId] =
					(character_interaction_actions ?? []) as CharacterInteractionAction[];
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

	function getOnceInteractions(): Interaction[] {
		return get(onceInteractionsStore);
	}

	function getFulfillInteractions(): Interaction[] {
		return get(fulfillInteractionsStore);
	}

	function getInteraction(id: InteractionId): Interaction | undefined {
		return getAllInteractions().find((i) => i.id === id);
	}

	function getBuildingInteraction(id: BuildingInteractionId): BuildingInteraction | undefined {
		return get(buildingInteractionStore).data[id];
	}

	function getItemInteraction(id: ItemInteractionId): ItemInteraction | undefined {
		return get(itemInteractionStore).data[id];
	}

	function getCharacterInteraction(id: CharacterInteractionId): CharacterInteraction | undefined {
		return get(characterInteractionStore).data[id];
	}

	function getBuildingInteractionActions(
		id: BuildingInteractionId
	): BuildingInteractionAction[] {
		return get(buildingInteractionActionStore).data[id] ?? [];
	}

	function getItemInteractionActions(id: ItemInteractionId): ItemInteractionAction[] {
		return get(itemInteractionActionStore).data[id] ?? [];
	}

	function getCharacterInteractionActions(
		id: CharacterInteractionId
	): CharacterInteractionAction[] {
		return get(characterInteractionActionStore).data[id] ?? [];
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

			return data;
		},

		async updateBuildingInteraction(
			id: BuildingInteractionId,
			updates: BuildingInteractionUpdate
		) {
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
				'scenario_id' | 'building_id' | 'building_interaction_id'
			>
		) {
			const buildingInteractionStoreValue = get(buildingInteractionStore);
			const buildingId =
				buildingInteractionStoreValue.data[buildingInteractionId]?.building_id || null;

			const { data, error } = await supabase
				.from('building_interaction_actions')
				.insert({
					...action,
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
			action: Omit<ItemInteractionActionInsert, 'scenario_id' | 'item_id' | 'item_interaction_id'>
		) {
			const itemInteractionStoreValue = get(itemInteractionStore);
			const itemId = itemInteractionStoreValue.data[itemInteractionId]?.item_id || null;

			const { data, error } = await supabase
				.from('item_interaction_actions')
				.insert({
					...action,
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
			const { error } = await supabase.from('item_interaction_actions').update(updates).eq('id', id);

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
				'scenario_id' | 'character_id' | 'character_interaction_id'
			>
		) {
			const characterInteractionStoreValue = get(characterInteractionStore);
			const characterId =
				characterInteractionStoreValue.data[characterInteractionId]?.character_id || null;

			const { data, error } = await supabase
				.from('character_interaction_actions')
				.insert({
					...action,
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
			const { error } = await supabase
				.from('character_interaction_actions')
				.delete()
				.eq('id', id);

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
		getBuildingInteraction,
		getItemInteraction,
		getCharacterInteraction,
		getBuildingInteractionActions,
		getItemInteractionActions,
		getCharacterInteractionActions,
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

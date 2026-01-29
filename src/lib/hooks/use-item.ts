import { writable, get, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	Item,
	ItemInsert,
	ItemUpdate,
	ItemState,
	ItemStateInsert,
	ItemStateUpdate,
	ItemInteraction,
	ItemInteractionInsert,
	ItemInteractionUpdate,
	ItemInteractionAction,
	ItemInteractionActionInsert,
	ItemInteractionActionUpdate,
	ItemId,
	ItemStateId,
	ItemInteractionId,
	ItemInteractionActionId,
	ScenarioId,
} from '$lib/types';
import { useApp } from './use-app.svelte';

type ItemDialogState =
	| { type: 'create' }
	| { type: 'update'; itemId: ItemId }
	| { type: 'delete'; itemId: ItemId }
	| undefined;

type ItemStateDialogState = { type: 'update'; itemStateId: ItemStateId } | undefined;

type ItemInteractionDialogState =
	| { type: 'create' }
	| { type: 'update'; interactionId: ItemInteractionId }
	| { type: 'delete'; interactionId: ItemInteractionId }
	| undefined;

let instance: ReturnType<typeof createItemStore> | null = null;

function createItemStore() {
	const { supabase } = useApp();

	const itemStore = writable<RecordFetchState<ItemId, Item>>({
		status: 'idle',
		data: {},
	});

	// item_id를 키로, 해당 아이템의 states 배열을 값으로
	const itemStateStore = writable<RecordFetchState<ItemId, ItemState[]>>({
		status: 'idle',
		data: {},
	});

	// item_interaction_id를 키로 관리
	const itemInteractionStore = writable<RecordFetchState<ItemInteractionId, ItemInteraction>>({
		status: 'idle',
		data: {},
	});

	// item_interaction_id를 키로, 해당 interaction의 actions 배열을 값으로
	const itemInteractionActionStore = writable<
		RecordFetchState<ItemInteractionId, ItemInteractionAction[]>
	>({
		status: 'idle',
		data: {},
	});

	const itemDialogStore = writable<ItemDialogState>(undefined);
	const itemStateDialogStore = writable<ItemStateDialogState>(undefined);
	const itemInteractionDialogStore = writable<ItemInteractionDialogState>(undefined);

	const itemUiStore = writable({
		showBodyPreview: false,
	});

	let initialized = false;

	function init() {
		initialized = true;
	}

	async function fetch() {
		if (!initialized) {
			throw new Error('useItem not initialized. Call init() first.');
		}

		itemStore.update((state) => ({ ...state, status: 'loading' }));
		itemInteractionStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			const { data, error } = await supabase
				.from('items')
				.select('*, item_states(*)')
				.order('name');

			if (error) throw error;

			const itemRecord: Record<ItemId, Item> = {};
			const stateRecord: Record<ItemId, ItemState[]> = {};

			for (const item of data ?? []) {
				const { item_states, ...itemData } = item;
				itemRecord[item.id as ItemId] = itemData as Item;
				stateRecord[item.id as ItemId] = (item_states ?? []) as ItemState[];
			}

			// Item interactions and actions
			const { data: interactionsData, error: interactionsError } = await supabase
				.from('item_interactions')
				.select('*, item_interaction_actions(*)')
				.order('created_at');

			if (interactionsError) throw interactionsError;

			const interactionRecord: Record<ItemInteractionId, ItemInteraction> = {};
			const actionRecord: Record<ItemInteractionId, ItemInteractionAction[]> = {};

			for (const item of interactionsData ?? []) {
				const { item_interaction_actions, ...interaction } = item;
				interactionRecord[item.id as ItemInteractionId] = interaction as ItemInteraction;
				actionRecord[item.id as ItemInteractionId] = (item_interaction_actions ??
					[]) as ItemInteractionAction[];
			}

			itemStore.set({
				status: 'success',
				data: itemRecord,
				error: undefined,
			});

			itemStateStore.set({
				status: 'success',
				data: stateRecord,
				error: undefined,
			});

			itemInteractionStore.set({
				status: 'success',
				data: interactionRecord,
				error: undefined,
			});

			itemInteractionActionStore.set({
				status: 'success',
				data: actionRecord,
				error: undefined,
			});
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			itemStore.set({
				status: 'error',
				data: {},
				error: err,
			});
			itemStateStore.set({
				status: 'error',
				data: {},
				error: err,
			});
			itemInteractionStore.set({
				status: 'error',
				data: {},
				error: err,
			});
			itemInteractionActionStore.set({
				status: 'error',
				data: {},
				error: err,
			});
		}
	}

	function openItemDialog(state: NonNullable<ItemDialogState>) {
		itemDialogStore.set(state);
	}

	function closeItemDialog() {
		itemDialogStore.set(undefined);
	}

	function openStateDialog(state: NonNullable<ItemStateDialogState>) {
		itemStateDialogStore.set(state);
	}

	function closeStateDialog() {
		itemStateDialogStore.set(undefined);
	}

	function openItemInteractionDialog(state: NonNullable<ItemInteractionDialogState>) {
		itemInteractionDialogStore.set(state);
	}

	function closeItemInteractionDialog() {
		itemInteractionDialogStore.set(undefined);
	}

	const admin = {
		itemUiStore: itemUiStore as Readable<{ showBodyPreview: boolean }>,

		setShowBodyPreview(value: boolean) {
			itemUiStore.update((s) => ({ ...s, showBodyPreview: value }));
		},

		async createItem(scenarioId: ScenarioId, item: Omit<ItemInsert, 'scenario_id'>) {
			const { data, error } = await supabase
				.from('items')
				.insert({
					...item,
					scenario_id: scenarioId,
				})
				.select('*')
				.single<Item>();

			if (error) throw error;

			itemStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as ItemId] = data;
				})
			);

			itemStateStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as ItemId] = [];
				})
			);

			return data;
		},

		async updateItem(id: ItemId, item: ItemUpdate) {
			const { error } = await supabase.from('items').update(item).eq('id', id);

			if (error) throw error;

			itemStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], item);
					}
				})
			);
		},

		async removeItem(id: ItemId) {
			const { error } = await supabase.from('items').delete().eq('id', id);

			if (error) throw error;

			itemStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);

			itemStateStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);
		},

		async createItemState(itemId: ItemId, state: Omit<ItemStateInsert, 'item_id'>) {
			const { data, error } = await supabase
				.from('item_states')
				.insert({
					...state,
					item_id: itemId,
				})
				.select()
				.single<ItemState>();

			if (error) throw error;

			itemStateStore.update((s) =>
				produce(s, (draft) => {
					if (draft.data[itemId]) {
						draft.data[itemId].push(data);
					} else {
						draft.data[itemId] = [data];
					}
				})
			);

			return data;
		},

		async updateItemState(stateId: ItemStateId, itemId: ItemId, updates: ItemStateUpdate) {
			const { error } = await supabase.from('item_states').update(updates).eq('id', stateId);

			if (error) throw error;

			itemStateStore.update((s) =>
				produce(s, (draft) => {
					const states = draft.data[itemId];
					if (states) {
						const state = states.find((is) => is.id === stateId);
						if (state) {
							Object.assign(state, updates);
						}
					}
				})
			);
		},

		async removeItemState(stateId: ItemStateId, itemId: ItemId) {
			const { error } = await supabase.from('item_states').delete().eq('id', stateId);

			if (error) throw error;

			itemStateStore.update((s) =>
				produce(s, (draft) => {
					const states = draft.data[itemId];
					if (states) {
						draft.data[itemId] = states.filter((is) => is.id !== stateId);
					}
				})
			);
		},

		async createItemInteraction(
			scenarioId: ScenarioId,
			interaction: Omit<ItemInteractionInsert, 'scenario_id'>
		) {
			const { data, error } = await supabase
				.from('item_interactions')
				.insert({
					...interaction,
					scenario_id: scenarioId,
				})
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
			interactionId: ItemInteractionId,
			action: Omit<ItemInteractionActionInsert, 'scenario_id' | 'item_id' | 'item_interaction_id'>
		) {
			// Get item_id from interaction
			const itemInteractionStoreValue = get(itemInteractionStore);
			const interaction = itemInteractionStoreValue.data[interactionId];
			const itemId = interaction?.item_id;

			if (!itemId) {
				throw new Error('Cannot find item_id for this interaction');
			}

			const { data, error } = await supabase
				.from('item_interaction_actions')
				.insert({
					...action,
					scenario_id: scenarioId,
					item_id: itemId,
					item_interaction_id: interactionId,
				})
				.select()
				.single<ItemInteractionAction>();

			if (error) throw error;

			itemInteractionActionStore.update((s) =>
				produce(s, (draft) => {
					if (draft.data[interactionId]) {
						draft.data[interactionId].push(data);
					} else {
						draft.data[interactionId] = [data];
					}
				})
			);

			return data;
		},

		async updateItemInteractionAction(
			actionId: ItemInteractionActionId,
			interactionId: ItemInteractionId,
			updates: ItemInteractionActionUpdate
		) {
			const { error } = await supabase
				.from('item_interaction_actions')
				.update(updates)
				.eq('id', actionId);

			if (error) throw error;

			itemInteractionActionStore.update((s) =>
				produce(s, (draft) => {
					const actions = draft.data[interactionId];
					if (actions) {
						const action = actions.find((a) => a.id === actionId);
						if (action) {
							Object.assign(action, updates);
						}
					}
				})
			);
		},

		async removeItemInteractionAction(
			actionId: ItemInteractionActionId,
			interactionId: ItemInteractionId
		) {
			const { error } = await supabase.from('item_interaction_actions').delete().eq('id', actionId);

			if (error) throw error;

			itemInteractionActionStore.update((s) =>
				produce(s, (draft) => {
					const actions = draft.data[interactionId];
					if (actions) {
						draft.data[interactionId] = actions.filter((a) => a.id !== actionId);
					}
				})
			);
		},
	};

	return {
		itemStore: itemStore as Readable<RecordFetchState<ItemId, Item>>,
		itemStateStore: itemStateStore as Readable<RecordFetchState<ItemId, ItemState[]>>,
		itemInteractionStore: itemInteractionStore as Readable<
			RecordFetchState<ItemInteractionId, ItemInteraction>
		>,
		itemInteractionActionStore: itemInteractionActionStore as Readable<
			RecordFetchState<ItemInteractionId, ItemInteractionAction[]>
		>,
		itemDialogStore: itemDialogStore as Readable<ItemDialogState>,
		itemStateDialogStore: itemStateDialogStore as Readable<ItemStateDialogState>,
		itemInteractionDialogStore: itemInteractionDialogStore as Readable<ItemInteractionDialogState>,
		init,
		fetch,
		openItemDialog,
		closeItemDialog,
		openStateDialog,
		closeStateDialog,
		openItemInteractionDialog,
		closeItemInteractionDialog,
		admin,
	};
}

export function useItem() {
	if (!instance) {
		instance = createItemStore();
	}
	return instance;
}

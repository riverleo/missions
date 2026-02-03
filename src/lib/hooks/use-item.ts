import { writable, derived, get, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	Database,
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
import { useInteraction } from './use-interaction';

type ItemDialogState =
	| { type: 'create' }
	| { type: 'update'; itemId: ItemId }
	| { type: 'delete'; itemId: ItemId }
	| undefined;

type ItemStateDialogState = { type: 'update'; itemStateId: ItemStateId } | undefined;

let instance: ReturnType<typeof createItemStore> | null = null;

function createItemStore() {
	const { supabase } = useApp();
	const interaction = useInteraction();

	const itemStore = writable<RecordFetchState<ItemId, Item>>({
		status: 'idle',
		data: {},
	});

	// item_id를 키로, 해당 아이템의 states 배열을 값으로
	const itemStateStore = writable<RecordFetchState<ItemId, ItemState[]>>({
		status: 'idle',
		data: {},
	});

	const itemDialogStore = writable<ItemDialogState>(undefined);
	const itemStateDialogStore = writable<ItemStateDialogState>(undefined);

	// Derived stores for computed values
	const allItemsStore = derived(itemStore, ($store) => Object.values($store.data));

	const allItemStatesStore = derived(itemStateStore, ($store) => $store.data);

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

	// Getter functions
	function getItem(id: string): Item | undefined {
		return get(itemStore).data[id as ItemId];
	}

	function getItemStates(itemId: string): ItemState[] | undefined {
		return get(itemStateStore).data[itemId as ItemId];
	}

	// GetAll functions
	function getAllItems(): Item[] {
		return get(allItemsStore);
	}

	function getAllItemStates(): Record<ItemId, ItemState[]> {
		return get(allItemStatesStore);
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


		// Item Interaction CRUD - delegated to useInteraction
		createItemInteraction: interaction.admin.createItemInteraction,
		updateItemInteraction: interaction.admin.updateItemInteraction,
		removeItemInteraction: interaction.admin.removeItemInteraction,
		createItemInteractionAction: interaction.admin.createItemInteractionAction,
		// Wrapper to maintain old signature (actionId, itemInteractionId, updates) -> (actionId, updates)
		async updateItemInteractionAction(
			actionId: ItemInteractionActionId,
			_itemInteractionId: ItemInteractionId,
			updates: ItemInteractionActionUpdate
		) {
			return interaction.admin.updateItemInteractionAction(actionId, updates);
		},
		// Wrapper to maintain old signature (actionId, itemInteractionId) -> (actionId)
		async removeItemInteractionAction(
			actionId: ItemInteractionActionId,
			_itemInteractionId: ItemInteractionId
		) {
			return interaction.admin.removeItemInteractionAction(actionId);
		},

	};

	return {
		itemStore: itemStore as Readable<RecordFetchState<ItemId, Item>>,
		itemStateStore: itemStateStore as Readable<RecordFetchState<ItemId, ItemState[]>>,
		itemDialogStore: itemDialogStore as Readable<ItemDialogState>,
		itemStateDialogStore: itemStateDialogStore as Readable<ItemStateDialogState>,
		allItemsStore,
		allItemStatesStore,
		init,
		fetch,
		openItemDialog,
		closeItemDialog,
		openStateDialog,
		closeStateDialog,
		getItem,
		getItemStates,
		getAllItems,
		getAllItemStates,
		admin,
	};
}

export function useItem() {
	if (!instance) {
		instance = createItemStore();
	}
	return instance;
}

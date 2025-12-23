import { writable, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	Item,
	ItemInsert,
	ItemUpdate,
	ItemState,
	ItemStateInsert,
	ItemStateUpdate,
	ItemId,
	ItemStateId,
	ScenarioId,
} from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';

type ItemDialogState =
	| { type: 'create' }
	| { type: 'delete'; itemId: ItemId }
	| undefined;

let instance: ReturnType<typeof createItemStore> | null = null;

function createItemStore() {
	const { supabase } = useServerPayload();

	const store = writable<RecordFetchState<ItemId, Item>>({
		status: 'idle',
		data: {},
	});

	// item_id를 키로, 해당 아이템의 states 배열을 값으로
	const stateStore = writable<RecordFetchState<ItemId, ItemState[]>>({
		status: 'idle',
		data: {},
	});

	const dialogStore = writable<ItemDialogState>(undefined);

	let currentScenarioId: ScenarioId | undefined;

	async function fetch(scenarioId: ScenarioId) {
		currentScenarioId = scenarioId;

		store.update((state) => ({ ...state, status: 'loading' }));

		try {
			const { data, error } = await supabase
				.from('items')
				.select('*, item_states(*)')
				.eq('scenario_id', scenarioId)
				.order('name');

			if (error) throw error;

			const itemRecord: Record<ItemId, Item> = {};
			const stateRecord: Record<ItemId, ItemState[]> = {};

			for (const item of data ?? []) {
				const { item_states, ...itemData } = item;
				itemRecord[item.id as ItemId] = itemData as Item;
				stateRecord[item.id as ItemId] = (item_states ?? []) as ItemState[];
			}

			store.set({
				status: 'success',
				data: itemRecord,
				error: undefined,
			});

			stateStore.set({
				status: 'success',
				data: stateRecord,
				error: undefined,
			});
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			store.set({
				status: 'error',
				data: {},
				error: err,
			});
			stateStore.set({
				status: 'error',
				data: {},
				error: err,
			});
		}
	}

	function openDialog(state: NonNullable<ItemDialogState>) {
		dialogStore.set(state);
	}

	function closeDialog() {
		dialogStore.set(undefined);
	}

	const admin = {
		async create(item: Omit<ItemInsert, 'scenario_id'>) {
			if (!currentScenarioId) {
				throw new Error('useItem: currentScenarioId is not set.');
			}

			const { data, error } = await supabase
				.from('items')
				.insert({
					...item,
					scenario_id: currentScenarioId,
				})
				.select('*')
				.single<Item>();

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as ItemId] = data;
				})
			);

			stateStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as ItemId] = [];
				})
			);

			return data;
		},

		async update(id: ItemId, item: ItemUpdate) {
			const { error } = await supabase.from('items').update(item).eq('id', id);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], item);
					}
				})
			);
		},

		async remove(id: ItemId) {
			const { error } = await supabase.from('items').delete().eq('id', id);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);

			stateStore.update((state) =>
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

			stateStore.update((s) =>
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

			stateStore.update((s) =>
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

			stateStore.update((s) =>
				produce(s, (draft) => {
					const states = draft.data[itemId];
					if (states) {
						draft.data[itemId] = states.filter((is) => is.id !== stateId);
					}
				})
			);
		},
	};

	return {
		store: store as Readable<RecordFetchState<ItemId, Item>>,
		stateStore: stateStore as Readable<RecordFetchState<ItemId, ItemState[]>>,
		dialogStore: dialogStore as Readable<ItemDialogState>,
		fetch,
		openDialog,
		closeDialog,
		admin,
	};
}

export function useItem() {
	if (!instance) {
		instance = createItemStore();
	}
	return instance;
}

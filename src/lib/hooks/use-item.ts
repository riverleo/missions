import { writable, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	Item,
	ItemInsert,
	ItemUpdate,
	ItemStateInsert,
	ItemStateUpdate,
} from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';

type ItemDialogState =
	| { type: 'create' }
	| { type: 'delete'; itemId: string }
	| undefined;

let instance: ReturnType<typeof createItemStore> | null = null;

function createItemStore() {
	const { supabase } = useServerPayload();

	const store = writable<RecordFetchState<Item>>({
		status: 'idle',
		data: {},
	});

	const dialogStore = writable<ItemDialogState>(undefined);

	let currentScenarioId: string | undefined;

	async function fetch(scenarioId: string) {
		currentScenarioId = scenarioId;

		store.update((state) => ({ ...state, status: 'loading' }));

		try {
			const { data, error } = await supabase
				.from('items')
				.select('*, item_states(*)')
				.eq('scenario_id', scenarioId)
				.order('name');

			if (error) throw error;

			const record: Record<string, Item> = {};
			for (const item of data ?? []) {
				record[item.id] = item;
			}

			store.set({
				status: 'success',
				data: record,
				error: undefined,
			});
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			store.set({
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
				.select('*, item_states(*)')
				.single();

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id] = data;
				})
			);

			return data;
		},

		async update(id: string, item: ItemUpdate) {
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

		async remove(id: string) {
			const { error } = await supabase.from('items').delete().eq('id', id);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);
		},

		async createItemState(itemId: string, state: Omit<ItemStateInsert, 'item_id'>) {
			const { data, error } = await supabase
				.from('item_states')
				.insert({
					...state,
					item_id: itemId,
				})
				.select()
				.single();

			if (error) throw error;

			store.update((s) =>
				produce(s, (draft) => {
					const item = draft.data[itemId];
					if (item) {
						item.item_states.push(data);
					}
				})
			);

			return data;
		},

		async updateItemState(stateId: string, itemId: string, updates: ItemStateUpdate) {
			const { error } = await supabase.from('item_states').update(updates).eq('id', stateId);

			if (error) throw error;

			store.update((s) =>
				produce(s, (draft) => {
					const item = draft.data[itemId];
					if (item) {
						const state = item.item_states.find((is) => is.id === stateId);
						if (state) {
							Object.assign(state, updates);
						}
					}
				})
			);
		},

		async removeItemState(stateId: string, itemId: string) {
			const { error } = await supabase.from('item_states').delete().eq('id', stateId);

			if (error) throw error;

			store.update((s) =>
				produce(s, (draft) => {
					const item = draft.data[itemId];
					if (item) {
						item.item_states = item.item_states.filter((is) => is.id !== stateId);
					}
				})
			);
		},
	};

	return {
		store: store as Readable<RecordFetchState<Item>>,
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

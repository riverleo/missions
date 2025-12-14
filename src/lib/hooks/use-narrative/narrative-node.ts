import type { NarrativeNodeInsert, NarrativeNodeUpdate, Supabase } from '$lib/types';
import type { NarrativeNodeStore } from '.';
import { produce } from 'immer';

export const fetchNarrativeNodes = async (supabase: Supabase, store: NarrativeNodeStore) => {
	store.update((state) => ({ ...state, status: 'loading' }));

	try {
		const { data, error } = await supabase
			.from('narrative_nodes')
			.select('*')
			.order('created_at', { ascending: true });

		if (error) throw error;

		// Convert array to Record
		const record: Record<string, (typeof data)[number]> = {};
		for (const item of data ?? []) {
			record[item.id] = item;
		}

		store.set({
			status: 'success',
			data: record,
			error: undefined,
		});
	} catch (error) {
		console.error(error);

		store.set({
			status: 'error',
			data: {},
			error: error instanceof Error ? error : new Error('Unknown error'),
		});
	}
};

export const createNarrativeNode =
	(supabase: Supabase, store: NarrativeNodeStore) => async (narrativeNode: NarrativeNodeInsert) => {
		try {
			const { data, error } = await supabase
				.from('narrative_nodes')
				.insert(narrativeNode)
				.select()
				.single();

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (!draft.data) {
						draft.data = {};
					}
					draft.data[data.id] = data;
				})
			);

			return data;
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	};

export const updateNarrativeNode =
	(supabase: Supabase, store: NarrativeNodeStore) =>
	async (id: string, narrativeNode: NarrativeNodeUpdate) => {
		try {
			const { error } = await supabase.from('narrative_nodes').update(narrativeNode).eq('id', id);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], narrativeNode);
					}
				})
			);
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	};

export const removeNarrativeNode =
	(supabase: Supabase, store: NarrativeNodeStore) => async (id: string) => {
		try {
			const { error } = await supabase.from('narrative_nodes').delete().eq('id', id);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	};

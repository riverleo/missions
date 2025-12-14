import type { NarrativeInsert, NarrativeUpdate, Supabase } from '$lib/types';
import type { NarrativeStore } from '.';
import { produce } from 'immer';

export const fetchNarratives = async (supabase: Supabase, store: NarrativeStore) => {
	store.update((state) => ({ ...state, status: 'loading' }));

	try {
		const { data, error } = await supabase
			.from('narratives')
			.select('*')
			.order('created_at', { ascending: false });

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
			data: undefined,
			error: error instanceof Error ? error : new Error('Unknown error'),
		});
	}
};

export const createNarrative =
	(supabase: Supabase, store: NarrativeStore) => async (narrative: NarrativeInsert) => {
		try {
			const { data, error } = await supabase
				.from('narratives')
				.insert(narrative)
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

export const updateNarrative =
	(supabase: Supabase, store: NarrativeStore) => async (id: string, narrative: NarrativeUpdate) => {
		try {
			const { error } = await supabase.from('narratives').update(narrative).eq('id', id);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], narrative);
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

export const removeNarrative =
	(supabase: Supabase, store: NarrativeStore) => async (id: string) => {
		try {
			const { error } = await supabase.from('narratives').delete().eq('id', id);

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

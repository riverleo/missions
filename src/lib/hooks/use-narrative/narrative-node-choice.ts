import type { NarrativeNodeChoiceInsert, NarrativeNodeChoiceUpdate, Supabase } from '$lib/types';
import type { NarrativeNodeChoiceStore } from '.';
import { produce } from 'immer';

export const fetchNarrativeNodeChoices = async (supabase: Supabase, store: NarrativeNodeChoiceStore) => {
	store.update((state) => ({ ...state, status: 'loading' }));

	try {
		const { data, error } = await supabase
			.from('narrative_node_choices')
			.select('*')
			.order('order_in_narrative_node', { ascending: true });

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

export const createNarrativeNodeChoice =
	(supabase: Supabase, store: NarrativeNodeChoiceStore) =>
	async (narrativeNodeChoice: NarrativeNodeChoiceInsert) => {
		try {
			const { data, error } = await supabase
				.from('narrative_node_choices')
				.insert(narrativeNodeChoice)
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

export const updateNarrativeNodeChoice =
	(supabase: Supabase, store: NarrativeNodeChoiceStore) =>
	async (id: string, narrativeNodeChoice: NarrativeNodeChoiceUpdate) => {
		try {
			const { error } = await supabase
				.from('narrative_node_choices')
				.update(narrativeNodeChoice)
				.eq('id', id);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], narrativeNodeChoice);
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

export const removeNarrativeNodeChoice =
	(supabase: Supabase, store: NarrativeNodeChoiceStore) => async (id: string) => {
		try {
			const { error } = await supabase.from('narrative_node_choices').delete().eq('id', id);

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

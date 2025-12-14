import type { NarrativeInsert, NarrativeUpdate, Supabase } from '$lib/types';
import type { NarrativeStore } from '.';

export const fetchNarratives = async (supabase: Supabase, store: NarrativeStore) => {
	store.update((state) => ({ ...state, status: 'loading' }));

	try {
		const { data, error } = await supabase
			.from('narratives')
			.select(
				`
					*,
					narrative_nodes (
						*,
						narrative_node_choices (*)
					),
					narrative_dice_rolls (*)
				`
			)
			.order('created_at', { ascending: false });

		if (error) throw error;

		store.set({
			status: 'success',
			data: data ?? [],
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
			const { error } = await supabase.from('narratives').insert(narrative);

			if (error) throw error;

			await fetchNarratives(supabase, store);
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

			await fetchNarratives(supabase, store);
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

			await fetchNarratives(supabase, store);
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	};

import type { NarrativeDiceRollInsert, NarrativeDiceRollUpdate, Supabase } from '$lib/types';
import type { NarrativeDiceRollStore } from '.';
import { produce } from 'immer';

export const fetchNarrativeDiceRolls = async (supabase: Supabase, store: NarrativeDiceRollStore) => {
	store.update((state) => ({ ...state, status: 'loading' }));

	try {
		const { data, error } = await supabase
			.from('narrative_dice_rolls')
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
			data: undefined,
			error: error instanceof Error ? error : new Error('Unknown error'),
		});
	}
};

export const createNarrativeDiceRoll =
	(supabase: Supabase, store: NarrativeDiceRollStore) =>
	async (narrativeDiceRoll: NarrativeDiceRollInsert) => {
		try {
			const { data, error } = await supabase
				.from('narrative_dice_rolls')
				.insert(narrativeDiceRoll)
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

export const updateNarrativeDiceRoll =
	(supabase: Supabase, store: NarrativeDiceRollStore) =>
	async (id: string, narrativeDiceRoll: NarrativeDiceRollUpdate) => {
		try {
			const { error } = await supabase
				.from('narrative_dice_rolls')
				.update(narrativeDiceRoll)
				.eq('id', id);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], narrativeDiceRoll);
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

export const removeNarrativeDiceRoll =
	(supabase: Supabase, store: NarrativeDiceRollStore) => async (id: string) => {
		try {
			const { error } = await supabase.from('narrative_dice_rolls').delete().eq('id', id);

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

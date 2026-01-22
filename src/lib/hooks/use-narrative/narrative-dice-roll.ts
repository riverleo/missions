import type {
	NarrativeDiceRollInsert,
	NarrativeDiceRollUpdate,
	Supabase,
	NarrativeDiceRollId,
	NarrativeDiceRoll,
	NarrativeDiceRollStore,
} from '$lib/types';
import { produce } from 'immer';

export const fetchNarrativeDiceRolls = async (
	supabase: Supabase,
	store: NarrativeDiceRollStore
) => {
	store.update((state) => ({ ...state, status: 'loading' }));

	try {
		const { data, error } = await supabase
			.from('narrative_dice_rolls')
			.select('*')
			.order('created_at', { ascending: true });

		if (error) throw error;

		// Convert array to Record
		const record: Record<NarrativeDiceRollId, NarrativeDiceRoll> = {};
		for (const item of data ?? []) {
			record[item.id as NarrativeDiceRollId] = item as NarrativeDiceRoll;
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

export const createNarrativeDiceRoll =
	(supabase: Supabase, store: NarrativeDiceRollStore) =>
	async (narrativeDiceRoll: NarrativeDiceRollInsert) => {
		try {
			const { data, error } = await supabase
				.from('narrative_dice_rolls')
				.insert(narrativeDiceRoll)
				.select()
				.single<NarrativeDiceRoll>();

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (!draft.data) {
						draft.data = {};
					}
					draft.data[data.id as NarrativeDiceRollId] = data;
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
	async (id: NarrativeDiceRollId, narrativeDiceRoll: NarrativeDiceRollUpdate) => {
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
	(supabase: Supabase, store: NarrativeDiceRollStore) => async (id: NarrativeDiceRollId) => {
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

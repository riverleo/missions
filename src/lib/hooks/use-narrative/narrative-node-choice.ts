import type {
	NarrativeNodeChoiceInsert,
	NarrativeNodeChoiceUpdate,
	Supabase,
	NarrativeNodeChoiceId,
	NarrativeNodeChoice,
	NarrativeNodeChoiceStore,
} from '$lib/types';
import { produce } from 'immer';

export const fetchNarrativeNodeChoices = async (
	supabase: Supabase,
	store: NarrativeNodeChoiceStore
) => {
	store.update((state) => ({ ...state, status: 'loading' }));

	try {
		const { data, error } = await supabase
			.from('narrative_node_choices')
			.select('*')
			.order('order_in_narrative_node', { ascending: true });

		if (error) throw error;

		// Convert array to Record
		const record: Record<NarrativeNodeChoiceId, NarrativeNodeChoice> = {};
		for (const item of data ?? []) {
			record[item.id as NarrativeNodeChoiceId] = item as NarrativeNodeChoice;
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

export const createNarrativeNodeChoice =
	(supabase: Supabase, store: NarrativeNodeChoiceStore) =>
	async (narrativeNodeChoice: NarrativeNodeChoiceInsert) => {
		try {
			const { data, error } = await supabase
				.from('narrative_node_choices')
				.insert(narrativeNodeChoice)
				.select()
				.single<NarrativeNodeChoice>();

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (!draft.data) {
						draft.data = {};
					}
					draft.data[data.id as NarrativeNodeChoiceId] = data;
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
	async (id: NarrativeNodeChoiceId, narrativeNodeChoice: NarrativeNodeChoiceUpdate) => {
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
	(supabase: Supabase, store: NarrativeNodeChoiceStore) => async (id: NarrativeNodeChoiceId) => {
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

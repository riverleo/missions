import type { NarrativeNodeInsert, NarrativeNodeUpdate, Supabase } from '$lib/types';
import type { NarrativeStore } from '.';
import { produce } from 'immer';

export const createNarrativeNode =
	(supabase: Supabase, store: NarrativeStore) => async (narrativeNode: NarrativeNodeInsert) => {
		try {
			const { data, error } = await supabase
				.from('narrative_nodes')
				.insert(narrativeNode)
				.select('*, narrative_node_choices (*)')
				.single();

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					const narrative = draft.data?.find((n) => n.id === narrativeNode.narrative_id);
					if (narrative) {
						if (!narrative.narrative_nodes) {
							narrative.narrative_nodes = [];
						}
						narrative.narrative_nodes.push(data);
					}
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
	(supabase: Supabase, store: NarrativeStore) => async (id: string, narrativeNode: NarrativeNodeUpdate) => {
		try {
			const { error } = await supabase.from('narrative_nodes').update(narrativeNode).eq('id', id);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						for (const narrative of draft.data) {
							if (narrative.narrative_nodes) {
								const nodeIndex = narrative.narrative_nodes.findIndex((n) => n.id === id);
								if (nodeIndex !== -1) {
									narrative.narrative_nodes[nodeIndex] = {
										...narrative.narrative_nodes[nodeIndex],
										...narrativeNode,
									};
									break;
								}
							}
						}
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
	(supabase: Supabase, store: NarrativeStore) => async (id: string) => {
		try {
			const { error } = await supabase.from('narrative_nodes').delete().eq('id', id);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						for (const narrative of draft.data) {
							if (narrative.narrative_nodes) {
								narrative.narrative_nodes = narrative.narrative_nodes.filter((n) => n.id !== id);
							}
						}
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

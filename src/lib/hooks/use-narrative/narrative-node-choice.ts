import type { NarrativeNodeChoiceInsert, NarrativeNodeChoiceUpdate, Supabase } from '$lib/types';
import type { NarrativeStore } from '.';
import { produce } from 'immer';

export const createNarrativeNodeChoice =
	(supabase: Supabase, store: NarrativeStore) => async (narrativeNodeChoice: NarrativeNodeChoiceInsert) => {
		try {
			const { data, error } = await supabase
				.from('narrative_node_choices')
				.insert(narrativeNodeChoice)
				.select()
				.single();

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						for (const narrative of draft.data) {
							if (narrative.narrative_nodes) {
								const node = narrative.narrative_nodes.find(
									(n) => n.id === narrativeNodeChoice.narrative_node_id
								);
								if (node) {
									if (!node.narrative_node_choices) {
										node.narrative_node_choices = [];
									}
									node.narrative_node_choices.push(data);
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

export const updateNarrativeNodeChoice =
	(supabase: Supabase, store: NarrativeStore) =>
	async (id: string, narrativeNodeChoice: NarrativeNodeChoiceUpdate) => {
		try {
			const { error } = await supabase
				.from('narrative_node_choices')
				.update(narrativeNodeChoice)
				.eq('id', id);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						for (const narrative of draft.data) {
							if (narrative.narrative_nodes) {
								for (const node of narrative.narrative_nodes) {
									if (node.narrative_node_choices) {
										const choiceIndex = node.narrative_node_choices.findIndex((c) => c.id === id);
										if (choiceIndex !== -1) {
											node.narrative_node_choices[choiceIndex] = {
												...node.narrative_node_choices[choiceIndex],
												...narrativeNodeChoice,
											};
											return;
										}
									}
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

export const removeNarrativeNodeChoice =
	(supabase: Supabase, store: NarrativeStore) => async (id: string) => {
		try {
			const { error } = await supabase.from('narrative_node_choices').delete().eq('id', id);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						for (const narrative of draft.data) {
							if (narrative.narrative_nodes) {
								for (const node of narrative.narrative_nodes) {
									if (node.narrative_node_choices) {
										node.narrative_node_choices = node.narrative_node_choices.filter(
											(c) => c.id !== id
										);
									}
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

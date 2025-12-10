import { writable, type Readable } from 'svelte/store';
import type {
	FetchState,
	Narrative,
	NarrativeInsert,
	NarrativeUpdate,
	NarrativeNodeInsert,
	NarrativeNodeUpdate,
	NarrativeNodeChoiceInsert,
	NarrativeNodeChoiceUpdate,
} from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';
import { produce } from 'immer';

let instance: ReturnType<typeof createNarrativeStore> | undefined = undefined;

function createNarrativeStore() {
	const { supabase } = useServerPayload();
	const store = writable<FetchState<Narrative[]>>({
		status: 'idle',
		data: undefined,
		error: undefined,
	});

	let initialized = false;

	async function fetchNarratives() {
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
					)
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
	}

	async function create(narrative: NarrativeInsert) {
		try {
			const { error } = await supabase.from('narratives').insert(narrative);

			if (error) throw error;

			await fetchNarratives();
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	}

	async function update(id: string, narrative: NarrativeUpdate) {
		try {
			const { error } = await supabase.from('narratives').update(narrative).eq('id', id);

			if (error) throw error;

			await fetchNarratives();
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	}

	async function remove(id: string) {
		try {
			const { error } = await supabase.from('narratives').delete().eq('id', id);

			if (error) throw error;

			await fetchNarratives();
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	}

	async function createNode(node: NarrativeNodeInsert) {
		try {
			const { data, error } = await supabase
				.from('narrative_nodes')
				.insert(node)
				.select('*, narrative_node_choices (*)')
				.single();

			if (error) throw error;

			// 스토어 데이터 업데이트 (Immer 사용)
			store.update((state) =>
				produce(state, (draft) => {
					const narrative = draft.data?.find((n) => n.id === node.narrative_id);
					if (narrative) {
						if (!narrative.narrative_nodes) {
							narrative.narrative_nodes = [];
						}
						narrative.narrative_nodes.push(data);
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
	}

	async function updateNode(id: string, node: NarrativeNodeUpdate) {
		try {
			const { error } = await supabase.from('narrative_nodes').update(node).eq('id', id);

			if (error) throw error;

			// 스토어 데이터 업데이트 (Immer 사용)
			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						for (const narrative of draft.data) {
							if (narrative.narrative_nodes) {
								const nodeIndex = narrative.narrative_nodes.findIndex((n) => n.id === id);
								if (nodeIndex !== -1) {
									narrative.narrative_nodes[nodeIndex] = {
										...narrative.narrative_nodes[nodeIndex],
										...node,
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
	}

	async function removeNode(id: string) {
		try {
			const { error } = await supabase.from('narrative_nodes').delete().eq('id', id);

			if (error) throw error;

			// 스토어 데이터 업데이트 (Immer 사용)
			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						for (const narrative of draft.data) {
							if (narrative.narrative_nodes) {
								narrative.narrative_nodes = narrative.narrative_nodes.filter(
									(n) => n.id !== id
								);
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
	}

	async function createChoice(choice: NarrativeNodeChoiceInsert) {
		try {
			const { data, error } = await supabase
				.from('narrative_node_choices')
				.insert(choice)
				.select()
				.single();

			if (error) throw error;

			// 스토어 데이터 업데이트 (Immer 사용)
			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						for (const narrative of draft.data) {
							if (narrative.narrative_nodes) {
								const node = narrative.narrative_nodes.find(
									(n) => n.id === choice.narrative_node_id
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
	}

	async function updateChoice(id: string, choice: NarrativeNodeChoiceUpdate) {
		try {
			const { error } = await supabase.from('narrative_node_choices').update(choice).eq('id', id);

			if (error) throw error;

			// 스토어 데이터 업데이트 (Immer 사용)
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
												...choice,
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
	}

	async function removeChoice(id: string) {
		try {
			const { error } = await supabase.from('narrative_node_choices').delete().eq('id', id);

			if (error) throw error;

			// 스토어 데이터 업데이트 (Immer 사용)
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
	}

	if (!initialized) {
		initialized = true;
		fetchNarratives();
	}

	return {
		store: store as Readable<FetchState<Narrative[]>>,
		admin: {
			create,
			update,
			remove,
			createNode,
			updateNode,
			removeNode,
			createChoice,
			updateChoice,
			removeChoice,
		},
	};
}

export function useNarrative() {
	if (!instance) {
		instance = createNarrativeStore();
	}
	return instance;
}

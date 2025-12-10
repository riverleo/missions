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

	async function createNode(node: NarrativeNodeInsert, shouldRefetch = true) {
		try {
			const { error } = await supabase.from('narrative_nodes').insert(node);

			if (error) throw error;

			if (shouldRefetch) {
				await fetchNarratives();
			}
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	}

	async function updateNode(id: string, node: NarrativeNodeUpdate, shouldRefetch = false) {
		try {
			const { error } = await supabase.from('narrative_nodes').update(node).eq('id', id);

			if (error) throw error;

			if (shouldRefetch) {
				await fetchNarratives();
			}
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	}

	async function removeNode(id: string, shouldRefetch = true) {
		try {
			const { error } = await supabase.from('narrative_nodes').delete().eq('id', id);

			if (error) throw error;

			if (shouldRefetch) {
				await fetchNarratives();
			}
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	}

	async function createChoice(choice: NarrativeNodeChoiceInsert, shouldRefetch = true) {
		try {
			const { error } = await supabase.from('narrative_node_choices').insert(choice);

			if (error) throw error;

			if (shouldRefetch) {
				await fetchNarratives();
			}
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	}

	async function updateChoice(
		id: string,
		choice: NarrativeNodeChoiceUpdate,
		shouldRefetch = false
	) {
		try {
			const { error } = await supabase.from('narrative_node_choices').update(choice).eq('id', id);

			if (error) throw error;

			if (shouldRefetch) {
				await fetchNarratives();
			}
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	}

	async function removeChoice(id: string, shouldRefetch = true) {
		try {
			const { error } = await supabase.from('narrative_node_choices').delete().eq('id', id);

			if (error) throw error;

			if (shouldRefetch) {
				await fetchNarratives();
			}
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

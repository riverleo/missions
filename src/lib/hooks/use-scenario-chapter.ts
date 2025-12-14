import { writable, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	FetchState,
	ScenarioChapter,
	ScenarioChapterInsert,
	ScenarioChapterUpdate,
} from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';

let instance: ReturnType<typeof createScenarioChapterStore> | null = null;

function createScenarioChapterStore() {
	const { supabase } = useServerPayload();
	const store = writable<FetchState<ScenarioChapter[]>>({
		status: 'idle',
		data: undefined,
		error: undefined,
	});

	let currentScenarioId: string | undefined;

	async function fetch(scenarioId: string) {
		currentScenarioId = scenarioId;
		store.update((state) => ({ ...state, status: 'loading' }));

		try {
			const { data, error } = await supabase
				.from('scenario_chapters')
				.select('*')
				.eq('scenario_id', scenarioId)
				.order('display_order_in_scenario', { ascending: true });

			if (error) throw error;

			store.set({
				status: 'success',
				data: data ?? [],
				error: undefined,
			});
		} catch (error) {
			store.set({
				status: 'error',
				data: undefined,
				error: error instanceof Error ? error : new Error('Unknown error'),
			});
		}
	}

	async function create(scenarioChapter: Omit<ScenarioChapterInsert, 'scenario_id'>) {
		if (!currentScenarioId) {
			throw new Error(
				'useScenarioChapter: currentScenarioId is not set. Call useScenario.init() first.'
			);
		}
		const { data, error } = await supabase
			.from('scenario_chapters')
			.insert({
				...scenarioChapter,
				scenario_id: currentScenarioId,
			})
			.select()
			.single();

		if (error) throw error;

		store.update((state) =>
			produce(state, (draft) => {
				if (draft.data) {
					draft.data.push(data);
				} else {
					draft.data = [data];
				}
			})
		);

		return data;
	}

	async function update(id: string, scenarioChapter: ScenarioChapterUpdate) {
		const { error } = await supabase.from('scenario_chapters').update(scenarioChapter).eq('id', id);

		if (error) throw error;

		store.update((state) =>
			produce(state, (draft) => {
				const chapter = draft.data?.find((c) => c.id === id);
				if (chapter) {
					Object.assign(chapter, scenarioChapter);
				}
			})
		);
	}

	async function remove(id: string) {
		const { error } = await supabase.from('scenario_chapters').delete().eq('id', id);

		if (error) throw error;

		store.update((state) =>
			produce(state, (draft) => {
				if (draft.data) {
					draft.data = draft.data.filter((c) => c.id !== id);
				}
			})
		);
	}

	async function publish(id: string) {
		const { error } = await supabase
			.from('scenario_chapters')
			.update({ status: 'published' })
			.eq('id', id);

		if (error) throw error;

		store.update((state) =>
			produce(state, (draft) => {
				const chapter = draft.data?.find((c) => c.id === id);
				if (chapter) {
					chapter.status = 'published';
				}
			})
		);
	}

	async function unpublish(id: string) {
		const { error } = await supabase
			.from('scenario_chapters')
			.update({ status: 'draft' })
			.eq('id', id);

		if (error) throw error;

		store.update((state) =>
			produce(state, (draft) => {
				const chapter = draft.data?.find((c) => c.id === id);
				if (chapter) {
					chapter.status = 'draft';
				}
			})
		);
	}

	return {
		store: store as Readable<FetchState<ScenarioChapter[]>>,
		fetch,
		admin: {
			create,
			update,
			remove,
			publish,
			unpublish,
		},
	};
}

export function useScenarioChapter() {
	if (!instance) {
		instance = createScenarioChapterStore();
	}
	return instance;
}

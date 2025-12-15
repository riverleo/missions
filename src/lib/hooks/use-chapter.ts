import { writable, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type { RecordFetchState, Chapter, ChapterInsert, ChapterUpdate } from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';

let instance: ReturnType<typeof createChapterStore> | null = null;

function createChapterStore() {
	const { supabase } = useServerPayload();
	const store = writable<RecordFetchState<Chapter>>({ status: 'idle', data: {} });

	let currentScenarioId: string | undefined;

	async function fetch(scenarioId: string) {
		currentScenarioId = scenarioId;
		store.update((state) => ({ ...state, status: 'loading' }));

		try {
			const { data, error } = await supabase
				.from('chapters')
				.select('*')
				.eq('scenario_id', scenarioId)
				.order('display_order_in_scenario', { ascending: true });

			if (error) throw error;

			// Convert array to Record
			const record: Record<string, Chapter> = {};
			for (const item of data ?? []) {
				record[item.id] = item;
			}

			store.set({
				status: 'success',
				data: record,
				error: undefined,
			});
		} catch (error) {
			store.set({
				status: 'error',
				data: {},
				error: error instanceof Error ? error : new Error('Unknown error'),
			});
		}
	}

	async function create(chapter: Omit<ChapterInsert, 'scenario_id'>) {
		if (!currentScenarioId) {
			throw new Error('useChapter: currentScenarioId is not set. Call useScenario.init() first.');
		}
		const { data, error } = await supabase
			.from('chapters')
			.insert({
				...chapter,
				scenario_id: currentScenarioId,
			})
			.select()
			.single();

		if (error) throw error;

		store.update((state) =>
			produce(state, (draft) => {
				draft.data[data.id] = data;
			})
		);

		return data;
	}

	async function update(id: string, chapter: ChapterUpdate) {
		const { error } = await supabase.from('chapters').update(chapter).eq('id', id);

		if (error) throw error;

		store.update((state) =>
			produce(state, (draft) => {
				if (draft.data?.[id]) {
					Object.assign(draft.data[id], chapter);
				}
			})
		);
	}

	async function remove(id: string) {
		const { error } = await supabase.from('chapters').delete().eq('id', id);

		if (error) throw error;

		store.update((state) =>
			produce(state, (draft) => {
				if (draft.data) {
					delete draft.data[id];
				}
			})
		);
	}

	async function publish(id: string) {
		const { error } = await supabase.from('chapters').update({ status: 'published' }).eq('id', id);

		if (error) throw error;

		store.update((state) =>
			produce(state, (draft) => {
				if (draft.data?.[id]) {
					draft.data[id].status = 'published';
				}
			})
		);
	}

	async function unpublish(id: string) {
		const { error } = await supabase.from('chapters').update({ status: 'draft' }).eq('id', id);

		if (error) throw error;

		store.update((state) =>
			produce(state, (draft) => {
				if (draft.data?.[id]) {
					draft.data[id].status = 'draft';
				}
			})
		);
	}

	return {
		store: store as Readable<RecordFetchState<Chapter>>,
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

export function useChapter() {
	if (!instance) {
		instance = createChapterStore();
	}
	return instance;
}

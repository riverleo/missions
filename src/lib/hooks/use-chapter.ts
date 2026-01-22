import { writable, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	Chapter,
	ChapterInsert,
	ChapterUpdate,
	ChapterId,
	ScenarioId,
} from '$lib/types';
import { useApp } from './use-app.svelte';

let instance: ReturnType<typeof createChapterStore> | null = null;

function createChapterStore() {
	const { supabase } = useApp();
	const chapterStore = writable<RecordFetchState<ChapterId, Chapter>>({ status: 'idle', data: {} });

	let initialized = false;
	let currentScenarioId: ScenarioId | undefined;

	function init() {
		initialized = true;
	}

	async function fetch(scenarioId: ScenarioId) {
		if (!initialized) {
			throw new Error('useChapter not initialized. Call init() first.');
		}
		currentScenarioId = scenarioId;
		chapterStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			const { data, error } = await supabase
				.from('chapters')
				.select('*')
				.eq('scenario_id', scenarioId)
				.order('display_order_in_scenario', { ascending: true });

			if (error) throw error;

			// Convert array to Record
			const record: Record<ChapterId, Chapter> = {};
			for (const item of data ?? []) {
				record[item.id as ChapterId] = item as Chapter;
			}

			chapterStore.set({
				status: 'success',
				data: record,
				error: undefined,
			});
		} catch (error) {
			chapterStore.set({
				status: 'error',
				data: {},
				error: error instanceof Error ? error : new Error('Unknown error'),
			});
		}
	}

	async function createChapter(chapter: Omit<ChapterInsert, 'scenario_id'>) {
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
			.single<Chapter>();

		if (error) throw error;

		chapterStore.update((state) =>
			produce(state, (draft) => {
				draft.data[data.id as ChapterId] = data;
			})
		);

		return data;
	}

	async function updateChapter(id: ChapterId, chapter: ChapterUpdate) {
		const { error } = await supabase.from('chapters').update(chapter).eq('id', id);

		if (error) throw error;

		chapterStore.update((state) =>
			produce(state, (draft) => {
				if (draft.data?.[id]) {
					Object.assign(draft.data[id], chapter);
				}
			})
		);
	}

	async function removeChapter(id: ChapterId) {
		const { error } = await supabase.from('chapters').delete().eq('id', id);

		if (error) throw error;

		chapterStore.update((state) =>
			produce(state, (draft) => {
				if (draft.data) {
					delete draft.data[id];
				}
			})
		);
	}

	async function publishChapter(id: ChapterId) {
		const { error } = await supabase.from('chapters').update({ status: 'published' }).eq('id', id);

		if (error) throw error;

		chapterStore.update((state) =>
			produce(state, (draft) => {
				if (draft.data?.[id]) {
					draft.data[id].status = 'published';
				}
			})
		);
	}

	async function unpublishChapter(id: ChapterId) {
		const { error } = await supabase.from('chapters').update({ status: 'draft' }).eq('id', id);

		if (error) throw error;

		chapterStore.update((state) =>
			produce(state, (draft) => {
				if (draft.data?.[id]) {
					draft.data[id].status = 'draft';
				}
			})
		);
	}

	return {
		chapterStore: chapterStore as Readable<RecordFetchState<ChapterId, Chapter>>,
		init,
		fetch,
		admin: {
			createChapter,
			updateChapter,
			removeChapter,
			publishChapter,
			unpublishChapter,
		},
	};
}

export function useChapter() {
	if (!instance) {
		instance = createChapterStore();
	}
	return instance;
}

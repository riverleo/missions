import { writable, type Readable } from 'svelte/store';
import type {
	FetchState,
	ScenarioChapter,
	ScenarioChapterInsert,
	ScenarioChapterUpdate,
} from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';

type ScenarioChapterDialogState =
	| { type: 'create' }
	| { type: 'update' | 'delete'; scenarioChapterId: string }
	| undefined;

let instance: ReturnType<typeof createScenarioChapterStore> | null = null;

function createScenarioChapterStore() {
	const { supabase } = useServerPayload();
	const store = writable<FetchState<ScenarioChapter[]>>({
		status: 'idle',
		data: undefined,
		error: undefined,
	});

	// 다이얼로그 상태 관리
	const dialogStore = writable<ScenarioChapterDialogState>(undefined);

	let currentScenarioId: string | undefined;

	async function fetch(scenarioId: string) {
		currentScenarioId = scenarioId;
		store.update((state) => ({ ...state, status: 'loading' }));

		try {
			const { data, error } = await supabase
				.from('scenario_chapters')
				.select('*')
				.eq('scenario_id', scenarioId)
				.order('order', { ascending: true });

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

	async function refetch() {
		if (!currentScenarioId) {
			throw new Error('useScenarioChapter: currentScenarioId is not set. Call useScenario.init() first.');
		}
		await fetch(currentScenarioId);
	}

	async function create(scenarioChapter: Omit<ScenarioChapterInsert, 'scenario_id'>) {
		if (!currentScenarioId) {
			throw new Error('useScenarioChapter: currentScenarioId is not set. Call useScenario.init() first.');
		}
		try {
			const { error } = await supabase.from('scenario_chapters').insert({
				...scenarioChapter,
				scenario_id: currentScenarioId,
			});

			if (error) throw error;

			await refetch();
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	}

	async function update(id: string, scenarioChapter: ScenarioChapterUpdate) {
		try {
			const { error } = await supabase.from('scenario_chapters').update(scenarioChapter).eq('id', id);

			if (error) throw error;

			await refetch();
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
			const { error } = await supabase.from('scenario_chapters').delete().eq('id', id);

			if (error) throw error;

			await refetch();
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	}

	function openDialog(state: NonNullable<ScenarioChapterDialogState>) {
		dialogStore.set(state);
	}

	function closeDialog() {
		dialogStore.set(undefined);
	}

	return {
		store: store as Readable<FetchState<ScenarioChapter[]>>,
		dialogStore: dialogStore as Readable<ScenarioChapterDialogState>,
		fetch,
		openDialog,
		closeDialog,
		admin: {
			create,
			update,
			remove,
		},
	};
}

export function useScenarioChapter() {
	if (!instance) {
		instance = createScenarioChapterStore();
	}
	return instance;
}

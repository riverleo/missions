import { writable, type Readable } from 'svelte/store';
import type {
	FetchState,
	ScenarioQuest,
	ScenarioQuestInsert,
	ScenarioQuestUpdate,
	ScenarioQuestBranchInsert,
	ScenarioQuestBranchUpdate,
} from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';

type ScenarioQuestDialogState =
	| { type: 'create' }
	| { type: 'update' | 'delete' | 'publish'; scenarioQuestId: string }
	| undefined;

let instance: ReturnType<typeof createScenarioQuestStore> | null = null;

function createScenarioQuestStore() {
	const { supabase } = useServerPayload();
	const store = writable<FetchState<ScenarioQuest[]>>({
		status: 'idle',
		data: undefined,
		error: undefined,
	});

	// 다이얼로그 상태 관리
	const dialogStore = writable<ScenarioQuestDialogState>(undefined);

	let currentScenarioId: string | undefined;

	async function fetch(scenarioId: string) {
		currentScenarioId = scenarioId;
		store.update((state) => ({ ...state, status: 'loading' }));

		try {
			const { data, error } = await supabase
				.from('scenario_quests')
				.select('*, scenario_quest_branches(*), scenario_chapter:scenario_chapters(*)')
				.eq('scenario_id', scenarioId);

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
			throw new Error('useScenarioQuest: currentScenarioId is not set. Call useScenario.init() first.');
		}
		await fetch(currentScenarioId);
	}

	async function create(scenarioQuest: Omit<ScenarioQuestInsert, 'scenario_id'>) {
		if (!currentScenarioId) {
			throw new Error('useScenarioQuest: currentScenarioId is not set. Call useScenario.init() first.');
		}
		try {
			const { error } = await supabase.from('scenario_quests').insert({
				...scenarioQuest,
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

	async function update(id: string, scenarioQuest: ScenarioQuestUpdate) {
		try {
			const { error } = await supabase.from('scenario_quests').update(scenarioQuest).eq('id', id);

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
			const { error } = await supabase.from('scenario_quests').delete().eq('id', id);

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

	async function publish(id: string) {
		try {
			const { error } = await supabase
				.from('scenario_quests')
				.update({ status: 'published' })
				.eq('id', id);

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

	async function unpublish(id: string) {
		try {
			const { error } = await supabase
				.from('scenario_quests')
				.update({ status: 'draft' })
				.eq('id', id);

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

	async function createScenarioQuestBranch(scenarioQuestBranch: ScenarioQuestBranchInsert, shouldRefetch = true) {
		try {
			const { data, error } = await supabase
				.from('scenario_quest_branches')
				.insert(scenarioQuestBranch)
				.select()
				.single();

			if (error) throw error;

			if (shouldRefetch) {
				await refetch();
			}

			return data;
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	}

	async function updateScenarioQuestBranch(id: string, scenarioQuestBranch: ScenarioQuestBranchUpdate, shouldRefetch = false) {
		try {
			const { error } = await supabase.from('scenario_quest_branches').update(scenarioQuestBranch).eq('id', id);

			if (error) throw error;

			if (shouldRefetch) {
				await refetch();
			}
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	}

	async function removeScenarioQuestBranch(id: string, shouldRefetch = true) {
		try {
			const { error } = await supabase.from('scenario_quest_branches').delete().eq('id', id);

			if (error) throw error;

			if (shouldRefetch) {
				await refetch();
			}
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	}

	function openDialog(state: NonNullable<ScenarioQuestDialogState>) {
		dialogStore.set(state);
	}

	function closeDialog() {
		dialogStore.set(undefined);
	}

	return {
		store: store as Readable<FetchState<ScenarioQuest[]>>,
		dialogStore: dialogStore as Readable<ScenarioQuestDialogState>,
		fetch,
		openDialog,
		closeDialog,
		admin: {
			create,
			update,
			remove,
			publish,
			unpublish,
			createScenarioQuestBranch,
			updateScenarioQuestBranch,
			removeScenarioQuestBranch,
		},
	};
}

export function useScenarioQuest() {
	if (!instance) {
		instance = createScenarioQuestStore();
	}
	return instance;
}

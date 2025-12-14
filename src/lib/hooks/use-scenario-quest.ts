import { writable, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	ScenarioQuest,
	ScenarioQuestInsert,
	ScenarioQuestUpdate,
	ScenarioQuestBranch,
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

	const scenarioQuestStore = writable<RecordFetchState<ScenarioQuest>>({
		status: 'idle',
		data: {},
	});

	const scenarioQuestBranchStore = writable<RecordFetchState<ScenarioQuestBranch>>({
		status: 'idle',
		data: {},
	});

	const dialogStore = writable<ScenarioQuestDialogState>(undefined);

	let currentScenarioId: string | undefined;

	async function fetch(scenarioId: string) {
		currentScenarioId = scenarioId;

		scenarioQuestStore.update((state) => ({ ...state, status: 'loading' }));
		scenarioQuestBranchStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			// Fetch quests and branches separately
			const [questsResult, branchesResult] = await Promise.all([
				supabase.from('scenario_quests').select('*').eq('scenario_id', scenarioId),
				supabase.from('scenario_quest_branches').select('*'),
			]);

			if (questsResult.error) throw questsResult.error;
			if (branchesResult.error) throw branchesResult.error;

			// Convert arrays to Records
			const questRecord: Record<string, ScenarioQuest> = {};
			for (const item of questsResult.data ?? []) {
				questRecord[item.id] = item;
			}

			// Filter branches that belong to quests in this scenario
			const questIds = new Set(Object.keys(questRecord));
			const branchRecord: Record<string, ScenarioQuestBranch> = {};
			for (const item of branchesResult.data ?? []) {
				if (questIds.has(item.scenario_quest_id)) {
					branchRecord[item.id] = item;
				}
			}

			scenarioQuestStore.set({
				status: 'success',
				data: questRecord,
				error: undefined,
			});

			scenarioQuestBranchStore.set({
				status: 'success',
				data: branchRecord,
				error: undefined,
			});
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');

			scenarioQuestStore.set({
				status: 'error',
				data: {},
				error: err,
			});

			scenarioQuestBranchStore.set({
				status: 'error',
				data: {},
				error: err,
			});
		}
	}

	function openDialog(state: NonNullable<ScenarioQuestDialogState>) {
		dialogStore.set(state);
	}

	function closeDialog() {
		dialogStore.set(undefined);
	}

	const admin = {
		async createQuest(scenarioQuest: Omit<ScenarioQuestInsert, 'scenario_id'>) {
			if (!currentScenarioId) {
				throw new Error(
					'useScenarioQuest: currentScenarioId is not set. Call useScenario.init() first.'
				);
			}

			const { data, error } = await supabase
				.from('scenario_quests')
				.insert({
					...scenarioQuest,
					scenario_id: currentScenarioId,
				})
				.select()
				.single();

			if (error) throw error;

			scenarioQuestStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id] = data;
				})
			);

			return data;
		},

		async updateQuest(id: string, scenarioQuest: ScenarioQuestUpdate) {
			const { error } = await supabase.from('scenario_quests').update(scenarioQuest).eq('id', id);

			if (error) throw error;

			scenarioQuestStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], scenarioQuest);
					}
				})
			);
		},

		async removeQuest(id: string) {
			const { error } = await supabase.from('scenario_quests').delete().eq('id', id);

			if (error) throw error;

			scenarioQuestStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);

			// Also remove related branches from local store
			scenarioQuestBranchStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						for (const branchId of Object.keys(draft.data)) {
							if (draft.data[branchId]?.scenario_quest_id === id) {
								delete draft.data[branchId];
							}
						}
					}
				})
			);
		},

		async publishQuest(id: string) {
			const { error } = await supabase
				.from('scenario_quests')
				.update({ status: 'published' })
				.eq('id', id);

			if (error) throw error;

			scenarioQuestStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						draft.data[id].status = 'published';
					}
				})
			);
		},

		async unpublishQuest(id: string) {
			const { error } = await supabase
				.from('scenario_quests')
				.update({ status: 'draft' })
				.eq('id', id);

			if (error) throw error;

			scenarioQuestStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						draft.data[id].status = 'draft';
					}
				})
			);
		},

		async createScenarioQuestBranch(scenarioQuestBranch: ScenarioQuestBranchInsert) {
			const { data, error } = await supabase
				.from('scenario_quest_branches')
				.insert(scenarioQuestBranch)
				.select()
				.single();

			if (error) throw error;

			scenarioQuestBranchStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id] = data;
				})
			);

			return data;
		},

		async updateScenarioQuestBranch(id: string, scenarioQuestBranch: ScenarioQuestBranchUpdate) {
			const { error } = await supabase
				.from('scenario_quest_branches')
				.update(scenarioQuestBranch)
				.eq('id', id);

			if (error) throw error;

			scenarioQuestBranchStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], scenarioQuestBranch);
					}
				})
			);
		},

		async removeScenarioQuestBranch(id: string) {
			const { error } = await supabase.from('scenario_quest_branches').delete().eq('id', id);

			if (error) throw error;

			scenarioQuestBranchStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);
		},
	};

	return {
		scenarioQuestStore: scenarioQuestStore as Readable<RecordFetchState<ScenarioQuest>>,
		scenarioQuestBranchStore: scenarioQuestBranchStore as Readable<RecordFetchState<ScenarioQuestBranch>>,
		dialogStore: dialogStore as Readable<ScenarioQuestDialogState>,
		fetch,
		openDialog,
		closeDialog,
		admin,
	};
}

export function useScenarioQuest() {
	if (!instance) {
		instance = createScenarioQuestStore();
	}
	return instance;
}

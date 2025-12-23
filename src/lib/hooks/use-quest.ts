import { writable, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	Quest,
	QuestInsert,
	QuestUpdate,
	QuestBranch,
	QuestBranchInsert,
	QuestBranchUpdate,
	QuestId,
	QuestBranchId,
	ScenarioId,
} from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';

type QuestDialogState =
	| { type: 'create' }
	| { type: 'update' | 'delete' | 'publish'; questId: QuestId }
	| undefined;

let instance: ReturnType<typeof createQuestStore> | null = null;

function createQuestStore() {
	const { supabase } = useServerPayload();

	const questStore = writable<RecordFetchState<QuestId, Quest>>({
		status: 'idle',
		data: {},
	});

	const questBranchStore = writable<RecordFetchState<QuestBranchId, QuestBranch>>({
		status: 'idle',
		data: {},
	});

	const dialogStore = writable<QuestDialogState>(undefined);

	let currentScenarioId: ScenarioId | undefined;

	async function fetch(scenarioId: ScenarioId) {
		currentScenarioId = scenarioId;

		questStore.update((state) => ({ ...state, status: 'loading' }));
		questBranchStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			// Fetch quests and branches separately
			const [questsResult, branchesResult] = await Promise.all([
				supabase.from('quests').select('*').eq('scenario_id', scenarioId),
				supabase.from('quest_branches').select('*'),
			]);

			if (questsResult.error) throw questsResult.error;
			if (branchesResult.error) throw branchesResult.error;

			// Convert arrays to Records
			const questRecord: Record<QuestId, Quest> = {};
			for (const item of questsResult.data ?? []) {
				questRecord[item.id as QuestId] = item as Quest;
			}

			// Filter branches that belong to quests in this scenario
			const questIds = new Set(Object.keys(questRecord));
			const branchRecord: Record<QuestBranchId, QuestBranch> = {};
			for (const item of branchesResult.data ?? []) {
				if (questIds.has(item.quest_id)) {
					branchRecord[item.id as QuestBranchId] = item as QuestBranch;
				}
			}

			questStore.set({
				status: 'success',
				data: questRecord,
				error: undefined,
			});

			questBranchStore.set({
				status: 'success',
				data: branchRecord,
				error: undefined,
			});
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');

			questStore.set({
				status: 'error',
				data: {},
				error: err,
			});

			questBranchStore.set({
				status: 'error',
				data: {},
				error: err,
			});
		}
	}

	function openDialog(state: NonNullable<QuestDialogState>) {
		dialogStore.set(state);
	}

	function closeDialog() {
		dialogStore.set(undefined);
	}

	const admin = {
		async createQuest(quest: Omit<QuestInsert, 'scenario_id'>) {
			if (!currentScenarioId) {
				throw new Error('useQuest: currentScenarioId is not set. Call useScenario.init() first.');
			}

			const { data, error } = await supabase
				.from('quests')
				.insert({
					...quest,
					scenario_id: currentScenarioId,
				})
				.select()
				.single<Quest>();

			if (error) throw error;

			questStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as QuestId] = data;
				})
			);

			return data;
		},

		async updateQuest(id: QuestId, quest: QuestUpdate) {
			const { error } = await supabase.from('quests').update(quest).eq('id', id);

			if (error) throw error;

			questStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], quest);
					}
				})
			);
		},

		async removeQuest(id: QuestId) {
			const { error } = await supabase.from('quests').delete().eq('id', id);

			if (error) throw error;

			questStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);

			// Also remove related branches from local store
			questBranchStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						for (const branchId of Object.keys(draft.data) as QuestBranchId[]) {
							if (draft.data[branchId]?.quest_id === id) {
								delete draft.data[branchId];
							}
						}
					}
				})
			);
		},

		async publishQuest(id: QuestId) {
			const { error } = await supabase.from('quests').update({ status: 'published' }).eq('id', id);

			if (error) throw error;

			questStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						draft.data[id].status = 'published';
					}
				})
			);
		},

		async unpublishQuest(id: QuestId) {
			const { error } = await supabase.from('quests').update({ status: 'draft' }).eq('id', id);

			if (error) throw error;

			questStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						draft.data[id].status = 'draft';
					}
				})
			);
		},

		async createQuestBranch(questBranch: QuestBranchInsert) {
			const { data, error } = await supabase
				.from('quest_branches')
				.insert(questBranch)
				.select()
				.single<QuestBranch>();

			if (error) throw error;

			questBranchStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as QuestBranchId] = data;
				})
			);

			return data;
		},

		async updateQuestBranch(id: QuestBranchId, questBranch: QuestBranchUpdate) {
			const { error } = await supabase.from('quest_branches').update(questBranch).eq('id', id);

			if (error) throw error;

			questBranchStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], questBranch);
					}
				})
			);
		},

		async removeQuestBranch(id: QuestBranchId) {
			const { error } = await supabase.from('quest_branches').delete().eq('id', id);

			if (error) throw error;

			questBranchStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);
		},
	};

	return {
		questStore: questStore as Readable<RecordFetchState<QuestId, Quest>>,
		questBranchStore: questBranchStore as Readable<RecordFetchState<QuestBranchId, QuestBranch>>,
		dialogStore: dialogStore as Readable<QuestDialogState>,
		fetch,
		openDialog,
		closeDialog,
		admin,
	};
}

export function useQuest() {
	if (!instance) {
		instance = createQuestStore();
	}
	return instance;
}

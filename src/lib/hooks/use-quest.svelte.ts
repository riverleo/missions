import { writable, type Readable } from 'svelte/store';
import type {
	FetchState,
	Quest,
	QuestInsert,
	QuestUpdate,
	QuestBranchInsert,
	QuestBranchUpdate,
} from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';

type DialogState =
	| { type: 'create' }
	| { type: 'update' | 'delete' | 'publish'; questId: string }
	| undefined;

let instance: ReturnType<typeof createQuestStore> | null = null;

function createQuestStore() {
	const { supabase } = useServerPayload();
	const store = writable<FetchState<Quest[]>>({
		status: 'idle',
		data: undefined,
		error: undefined,
	});

	// 다이얼로그 상태 관리
	const dialogStore = writable<DialogState>(undefined);

	let initialized = false;

	async function fetchQuests() {
		store.update((state) => ({ ...state, status: 'loading' }));

		try {
			const { data, error } = await supabase.from('quests').select('*, quest_branches(*), chapter:chapters(*)');

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

	async function create(quest: QuestInsert) {
		try {
			const { error } = await supabase.from('quests').insert(quest);

			if (error) throw error;

			await fetchQuests();
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	}

	async function update(id: string, quest: QuestUpdate) {
		try {
			const { error } = await supabase.from('quests').update(quest).eq('id', id);

			if (error) throw error;

			await fetchQuests();
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
			const { error } = await supabase.from('quests').delete().eq('id', id);

			if (error) throw error;

			await fetchQuests();
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
				.from('quests')
				.update({ status: 'published' })
				.eq('id', id);

			if (error) throw error;

			await fetchQuests();
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
				.from('quests')
				.update({ status: 'draft' })
				.eq('id', id);

			if (error) throw error;

			await fetchQuests();
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	}

	async function createBranch(branch: QuestBranchInsert, shouldRefetch = true) {
		try {
			const { data, error } = await supabase
				.from('quest_branches')
				.insert(branch)
				.select()
				.single();

			if (error) throw error;

			if (shouldRefetch) {
				await fetchQuests();
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

	async function updateBranch(id: string, branch: QuestBranchUpdate, shouldRefetch = false) {
		try {
			const { error } = await supabase.from('quest_branches').update(branch).eq('id', id);

			if (error) throw error;

			if (shouldRefetch) {
				await fetchQuests();
			}
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	}

	async function removeBranch(id: string, shouldRefetch = true) {
		try {
			const { error } = await supabase.from('quest_branches').delete().eq('id', id);

			if (error) throw error;

			if (shouldRefetch) {
				await fetchQuests();
			}
		} catch (error) {
			store.update((state) => ({
				...state,
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
			throw error;
		}
	}

	function openDialog(state: NonNullable<DialogState>) {
		dialogStore.set(state);
	}

	function closeDialog() {
		dialogStore.set(undefined);
	}

	if (!initialized) {
		initialized = true;
		fetchQuests();
	}

	return {
		store: store as Readable<FetchState<Quest[]>>,
		dialogStore: dialogStore as Readable<DialogState>,
		openDialog,
		closeDialog,
		admin: {
			create,
			update,
			remove,
			publish,
			unpublish,
			createBranch,
			updateBranch,
			removeBranch,
		},
	};
}

export function useQuest() {
	if (!instance) {
		instance = createQuestStore();
	}
	return instance;
}

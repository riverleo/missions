import { get, writable, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	NeedBehavior,
	NeedBehaviorInsert,
	NeedBehaviorUpdate,
	NeedBehaviorAction,
	NeedBehaviorActionInsert,
	NeedBehaviorActionUpdate,
	NeedBehaviorId,
	NeedBehaviorActionId,
	ScenarioId,
} from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';

type NeedBehaviorDialogState =
	| { type: 'create' }
	| { type: 'update'; needBehaviorId: NeedBehaviorId }
	| { type: 'delete'; needBehaviorId: NeedBehaviorId }
	| undefined;

let instance: ReturnType<typeof createNeedBehaviorStore> | null = null;

function createNeedBehaviorStore() {
	const { supabase } = useServerPayload();

	const needBehaviorStore = writable<RecordFetchState<NeedBehaviorId, NeedBehavior>>({
		status: 'idle',
		data: {},
	});

	const needBehaviorActionStore = writable<
		RecordFetchState<NeedBehaviorActionId, NeedBehaviorAction>
	>({
		status: 'idle',
		data: {},
	});

	const dialogStore = writable<NeedBehaviorDialogState>(undefined);

	let initialized = false;
	let currentScenarioId: ScenarioId | undefined;

	function init() {
		initialized = true;
	}

	async function fetch(scenarioId: ScenarioId) {
		if (!initialized) {
			throw new Error('useNeedBehavior not initialized. Call init() first.');
		}
		currentScenarioId = scenarioId;

		needBehaviorStore.update((state) => ({ ...state, status: 'loading' }));
		needBehaviorActionStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			const [behaviorsResult, actionsResult] = await Promise.all([
				supabase.from('need_behaviors').select('*').eq('scenario_id', scenarioId).order('name'),
				supabase.from('need_behavior_actions').select('*').eq('scenario_id', scenarioId),
			]);

			if (behaviorsResult.error) throw behaviorsResult.error;
			if (actionsResult.error) throw actionsResult.error;

			const behaviorRecord: Record<NeedBehaviorId, NeedBehavior> = {};
			for (const item of behaviorsResult.data ?? []) {
				behaviorRecord[item.id as NeedBehaviorId] = item as NeedBehavior;
			}

			const actionRecord: Record<NeedBehaviorActionId, NeedBehaviorAction> = {};
			for (const item of actionsResult.data ?? []) {
				actionRecord[item.id as NeedBehaviorActionId] = item as NeedBehaviorAction;
			}

			needBehaviorStore.set({ status: 'success', data: behaviorRecord });
			needBehaviorActionStore.set({ status: 'success', data: actionRecord });
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			needBehaviorStore.set({ status: 'error', data: {}, error: err });
			needBehaviorActionStore.set({ status: 'error', data: {}, error: err });
		}
	}

	function openDialog(state: NonNullable<NeedBehaviorDialogState>) {
		dialogStore.set(state);
	}

	function closeDialog() {
		dialogStore.set(undefined);
	}

	const admin = {
		// NeedBehavior CRUD
		async create(behavior: Omit<NeedBehaviorInsert, 'scenario_id'>) {
			if (!currentScenarioId) {
				throw new Error('useNeedBehavior: currentScenarioId is not set.');
			}

			const { data, error } = await supabase
				.from('need_behaviors')
				.insert({ ...behavior, scenario_id: currentScenarioId })
				.select()
				.single<NeedBehavior>();

			if (error) throw error;

			needBehaviorStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as NeedBehaviorId] = data;
				})
			);

			return data;
		},

		async update(id: NeedBehaviorId, behavior: NeedBehaviorUpdate) {
			const { error } = await supabase.from('need_behaviors').update(behavior).eq('id', id);

			if (error) throw error;

			needBehaviorStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data[id]) {
						Object.assign(draft.data[id], behavior);
					}
				})
			);
		},

		async remove(id: NeedBehaviorId) {
			const { error } = await supabase.from('need_behaviors').delete().eq('id', id);

			if (error) throw error;

			needBehaviorStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
				})
			);

			// Also remove related actions from the store
			needBehaviorActionStore.update((state) =>
				produce(state, (draft) => {
					for (const actionId of Object.keys(draft.data) as NeedBehaviorActionId[]) {
						if (draft.data[actionId]?.behavior_id === id) {
							delete draft.data[actionId];
						}
					}
				})
			);
		},

		// NeedBehaviorAction CRUD
		async createNeedBehaviorAction(action: Omit<NeedBehaviorActionInsert, 'scenario_id'>) {
			if (!currentScenarioId) {
				throw new Error('useNeedBehavior: currentScenarioId is not set.');
			}

			// 해당 behavior에 첫 번째 액션이면 자동으로 root로 설정
			const existingActions = Object.values(get(needBehaviorActionStore).data);
			const isFirstAction = !existingActions.some((a) => a.behavior_id === action.behavior_id);

			const { data, error } = await supabase
				.from('need_behavior_actions')
				.insert({ ...action, scenario_id: currentScenarioId, root: isFirstAction })
				.select()
				.single<NeedBehaviorAction>();

			if (error) throw error;

			needBehaviorActionStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as NeedBehaviorActionId] = data;
				})
			);

			return data;
		},

		async updateNeedBehaviorAction(id: NeedBehaviorActionId, action: NeedBehaviorActionUpdate) {
			const { error } = await supabase.from('need_behavior_actions').update(action).eq('id', id);

			if (error) throw error;

			needBehaviorActionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data[id]) {
						Object.assign(draft.data[id], action);
					}
				})
			);
		},

		async removeNeedBehaviorAction(id: NeedBehaviorActionId) {
			const { error } = await supabase.from('need_behavior_actions').delete().eq('id', id);

			if (error) throw error;

			needBehaviorActionStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
				})
			);
		},
	};

	return {
		needBehaviorStore: needBehaviorStore as Readable<
			RecordFetchState<NeedBehaviorId, NeedBehavior>
		>,
		needBehaviorActionStore: needBehaviorActionStore as Readable<
			RecordFetchState<NeedBehaviorActionId, NeedBehaviorAction>
		>,
		dialogStore: dialogStore as Readable<NeedBehaviorDialogState>,
		init,
		fetch,
		openDialog,
		closeDialog,
		admin,
	};
}

export function useNeedBehavior() {
	if (!instance) {
		instance = createNeedBehaviorStore();
	}
	return instance;
}

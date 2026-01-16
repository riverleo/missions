import { get, writable, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	ConditionBehavior,
	ConditionBehaviorInsert,
	ConditionBehaviorUpdate,
	ConditionBehaviorAction,
	ConditionBehaviorActionInsert,
	ConditionBehaviorActionUpdate,
	ConditionBehaviorId,
	ConditionBehaviorActionId,
	ScenarioId,
} from '$lib/types';
import { useApp } from './use-app.svelte';

type ConditionBehaviorDialogState =
	| { type: 'create' }
	| { type: 'update'; conditionBehaviorId: ConditionBehaviorId }
	| { type: 'delete'; conditionBehaviorId: ConditionBehaviorId }
	| undefined;

let instance: ReturnType<typeof createConditionBehaviorStore> | null = null;

function createConditionBehaviorStore() {
	const { supabase } = useApp();

	const conditionBehaviorStore = writable<RecordFetchState<ConditionBehaviorId, ConditionBehavior>>(
		{
			status: 'idle',
			data: {},
		}
	);

	const conditionBehaviorActionStore = writable<
		RecordFetchState<ConditionBehaviorActionId, ConditionBehaviorAction>
	>({
		status: 'idle',
		data: {},
	});

	const dialogStore = writable<ConditionBehaviorDialogState>(undefined);

	let initialized = false;
	let currentScenarioId: ScenarioId | undefined;

	function init() {
		initialized = true;
	}

	async function fetch(scenarioId: ScenarioId) {
		if (!initialized) {
			throw new Error('useConditionBehavior not initialized. Call init() first.');
		}
		currentScenarioId = scenarioId;

		conditionBehaviorStore.update((state) => ({ ...state, status: 'loading' }));
		conditionBehaviorActionStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			const [behaviorsResult, actionsResult] = await Promise.all([
				supabase.from('condition_behaviors').select('*').eq('scenario_id', scenarioId),
				supabase.from('condition_behavior_actions').select('*').eq('scenario_id', scenarioId),
			]);

			if (behaviorsResult.error) throw behaviorsResult.error;
			if (actionsResult.error) throw actionsResult.error;

			const behaviorRecord: Record<ConditionBehaviorId, ConditionBehavior> = {};
			for (const item of behaviorsResult.data ?? []) {
				behaviorRecord[item.id as ConditionBehaviorId] = item as ConditionBehavior;
			}

			const actionRecord: Record<ConditionBehaviorActionId, ConditionBehaviorAction> = {};
			for (const item of actionsResult.data ?? []) {
				actionRecord[item.id as ConditionBehaviorActionId] = item as ConditionBehaviorAction;
			}

			conditionBehaviorStore.set({ status: 'success', data: behaviorRecord });
			conditionBehaviorActionStore.set({ status: 'success', data: actionRecord });
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			conditionBehaviorStore.set({ status: 'error', data: {}, error: err });
			conditionBehaviorActionStore.set({ status: 'error', data: {}, error: err });
		}
	}

	function openDialog(state: NonNullable<ConditionBehaviorDialogState>) {
		dialogStore.set(state);
	}

	function closeDialog() {
		dialogStore.set(undefined);
	}

	const admin = {
		// ConditionBehavior CRUD
		async create(behavior: Omit<ConditionBehaviorInsert, 'scenario_id'>) {
			if (!currentScenarioId) {
				throw new Error('useConditionBehavior: currentScenarioId is not set.');
			}

			const { data, error } = await supabase
				.from('condition_behaviors')
				.insert({ ...behavior, scenario_id: currentScenarioId })
				.select()
				.single<ConditionBehavior>();

			if (error) throw error;

			conditionBehaviorStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as ConditionBehaviorId] = data;
				})
			);

			return data;
		},

		async update(id: ConditionBehaviorId, behavior: ConditionBehaviorUpdate) {
			const { error } = await supabase.from('condition_behaviors').update(behavior).eq('id', id);

			if (error) throw error;

			conditionBehaviorStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data[id]) {
						Object.assign(draft.data[id], behavior);
					}
				})
			);
		},

		async remove(id: ConditionBehaviorId) {
			const { error } = await supabase.from('condition_behaviors').delete().eq('id', id);

			if (error) throw error;

			conditionBehaviorStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
				})
			);

			// Also remove related actions from the store
			conditionBehaviorActionStore.update((state) =>
				produce(state, (draft) => {
					for (const actionId of Object.keys(draft.data) as ConditionBehaviorActionId[]) {
						if (draft.data[actionId]?.condition_behavior_id === id) {
							delete draft.data[actionId];
						}
					}
				})
			);
		},

		// ConditionBehaviorAction CRUD
		async createConditionBehaviorAction(
			action: Omit<ConditionBehaviorActionInsert, 'scenario_id'>
		) {
			if (!currentScenarioId) {
				throw new Error('useConditionBehavior: currentScenarioId is not set.');
			}

			// 해당 behavior에 첫 번째 액션이면 자동으로 root로 설정
			const existingActions = Object.values(get(conditionBehaviorActionStore).data);
			const isFirstAction = !existingActions.some(
				(a) => a.condition_behavior_id === action.condition_behavior_id
			);

			const { data, error } = await supabase
				.from('condition_behavior_actions')
				.insert({ ...action, scenario_id: currentScenarioId, root: isFirstAction })
				.select()
				.single<ConditionBehaviorAction>();

			if (error) throw error;

			conditionBehaviorActionStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as ConditionBehaviorActionId] = data;
				})
			);

			return data;
		},

		async updateConditionBehaviorAction(
			id: ConditionBehaviorActionId,
			action: ConditionBehaviorActionUpdate
		) {
			const { error } = await supabase
				.from('condition_behavior_actions')
				.update(action)
				.eq('id', id);

			if (error) throw error;

			conditionBehaviorActionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data[id]) {
						Object.assign(draft.data[id], action);
					}
				})
			);
		},

		async removeConditionBehaviorAction(id: ConditionBehaviorActionId) {
			const { error } = await supabase.from('condition_behavior_actions').delete().eq('id', id);

			if (error) throw error;

			conditionBehaviorActionStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
				})
			);
		},
	};

	return {
		conditionBehaviorStore: conditionBehaviorStore as Readable<
			RecordFetchState<ConditionBehaviorId, ConditionBehavior>
		>,
		conditionBehaviorActionStore: conditionBehaviorActionStore as Readable<
			RecordFetchState<ConditionBehaviorActionId, ConditionBehaviorAction>
		>,
		dialogStore: dialogStore as Readable<ConditionBehaviorDialogState>,
		init,
		fetch,
		openDialog,
		closeDialog,
		admin,
	};
}

export function useConditionBehavior() {
	if (!instance) {
		instance = createConditionBehaviorStore();
	}
	return instance;
}

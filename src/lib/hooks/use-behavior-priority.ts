import { get, writable } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	BehaviorPriority,
	BehaviorPriorityInsert,
	BehaviorPriorityUpdate,
	BehaviorPriorityId,
	ScenarioId,
} from '$lib/types';
import { useApp } from './use-app.svelte';

type BehaviorPriorityDialogState =
	| { type: 'create' }
	| { type: 'update'; behaviorPriorityId: BehaviorPriorityId }
	| { type: 'delete'; behaviorPriorityId: BehaviorPriorityId }
	| undefined;

let instance: ReturnType<typeof createBehaviorPriorityStore> | null = null;

function createBehaviorPriorityStore() {
	const { supabase } = useApp();

	const store = writable<RecordFetchState<BehaviorPriorityId, BehaviorPriority>>({
		status: 'idle',
		data: {},
	});

	const dialogStore = writable<BehaviorPriorityDialogState>(undefined);

	let initialized = false;
	let currentScenarioId: ScenarioId | undefined;

	function init() {
		initialized = true;
	}

	async function fetch(scenarioId: ScenarioId) {
		if (!initialized) {
			throw new Error('useBehaviorPriority not initialized. Call init() first.');
		}
		currentScenarioId = scenarioId;

		store.update((state) => ({ ...state, status: 'loading' }));

		try {
			const result = await supabase
				.from('behavior_priorities')
				.select('*')
				.eq('scenario_id', scenarioId)
				.order('priority');

			if (result.error) throw result.error;

			const record: Record<BehaviorPriorityId, BehaviorPriority> = {};
			for (const item of result.data ?? []) {
				record[item.id as BehaviorPriorityId] = item as BehaviorPriority;
			}

			store.set({ status: 'success', data: record });
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			store.set({ status: 'error', data: {}, error: err });
		}
	}

	function openDialog(state: NonNullable<BehaviorPriorityDialogState>) {
		dialogStore.set(state);
	}

	function closeDialog() {
		dialogStore.set(undefined);
	}

	const admin = {
		async create(priority: Omit<BehaviorPriorityInsert, 'scenario_id'>) {
			if (!currentScenarioId) throw new Error('Scenario ID is not set');

			const result = await supabase
				.from('behavior_priorities')
				.insert({ ...priority, scenario_id: currentScenarioId })
				.select()
				.single();

			if (result.error) throw result.error;

			const newPriority = result.data as BehaviorPriority;

			store.update((state) =>
				produce(state, (draft) => {
					draft.data[newPriority.id as BehaviorPriorityId] = newPriority;
				})
			);

			return newPriority;
		},

		async update(id: BehaviorPriorityId, priority: BehaviorPriorityUpdate) {
			const result = await supabase
				.from('behavior_priorities')
				.update(priority)
				.eq('id', id)
				.select()
				.single();

			if (result.error) throw result.error;

			const updated = result.data as BehaviorPriority;

			store.update((state) =>
				produce(state, (draft) => {
					draft.data[id] = updated;
				})
			);

			return updated;
		},

		async remove(id: BehaviorPriorityId) {
			const result = await supabase.from('behavior_priorities').delete().eq('id', id);

			if (result.error) throw result.error;

			store.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
				})
			);
		},
	};

	return {
		store,
		dialogStore,
		init,
		fetch,
		openDialog,
		closeDialog,
		admin,
	};
}

export function useBehaviorPriority() {
	if (!instance) {
		instance = createBehaviorPriorityStore();
	}
	return instance;
}

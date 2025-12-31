import { get, writable, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	ItemBehavior,
	ItemBehaviorInsert,
	ItemBehaviorUpdate,
	ItemBehaviorAction,
	ItemBehaviorActionInsert,
	ItemBehaviorActionUpdate,
	ItemBehaviorId,
	ItemBehaviorActionId,
	ScenarioId,
} from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';

type ItemBehaviorDialogState =
	| { type: 'create' }
	| { type: 'update'; itemBehaviorId: ItemBehaviorId }
	| { type: 'delete'; itemBehaviorId: ItemBehaviorId }
	| undefined;

let instance: ReturnType<typeof createItemBehaviorStore> | null = null;

function createItemBehaviorStore() {
	const { supabase } = useServerPayload();

	const itemBehaviorStore = writable<RecordFetchState<ItemBehaviorId, ItemBehavior>>({
		status: 'idle',
		data: {},
	});

	const itemBehaviorActionStore = writable<
		RecordFetchState<ItemBehaviorActionId, ItemBehaviorAction>
	>({
		status: 'idle',
		data: {},
	});

	const dialogStore = writable<ItemBehaviorDialogState>(undefined);

	let initialized = false;
	let currentScenarioId: ScenarioId | undefined;

	function init() {
		initialized = true;
	}

	async function fetch(scenarioId: ScenarioId) {
		if (!initialized) {
			throw new Error('useItemBehavior not initialized. Call init() first.');
		}
		currentScenarioId = scenarioId;

		itemBehaviorStore.update((state) => ({ ...state, status: 'loading' }));
		itemBehaviorActionStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			const [behaviorsResult, actionsResult] = await Promise.all([
				supabase.from('item_behaviors').select('*').eq('scenario_id', scenarioId),
				supabase.from('item_behavior_actions').select('*').eq('scenario_id', scenarioId),
			]);

			if (behaviorsResult.error) throw behaviorsResult.error;
			if (actionsResult.error) throw actionsResult.error;

			const behaviorRecord: Record<ItemBehaviorId, ItemBehavior> = {};
			for (const item of behaviorsResult.data ?? []) {
				behaviorRecord[item.id as ItemBehaviorId] = item as ItemBehavior;
			}

			const actionRecord: Record<ItemBehaviorActionId, ItemBehaviorAction> = {};
			for (const item of actionsResult.data ?? []) {
				actionRecord[item.id as ItemBehaviorActionId] = item as ItemBehaviorAction;
			}

			itemBehaviorStore.set({ status: 'success', data: behaviorRecord });
			itemBehaviorActionStore.set({ status: 'success', data: actionRecord });
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			itemBehaviorStore.set({ status: 'error', data: {}, error: err });
			itemBehaviorActionStore.set({ status: 'error', data: {}, error: err });
		}
	}

	function openDialog(state: NonNullable<ItemBehaviorDialogState>) {
		dialogStore.set(state);
	}

	function closeDialog() {
		dialogStore.set(undefined);
	}

	const admin = {
		// ItemBehavior CRUD
		async create(behavior: Omit<ItemBehaviorInsert, 'scenario_id'>) {
			if (!currentScenarioId) {
				throw new Error('useItemBehavior: currentScenarioId is not set.');
			}

			const { data, error } = await supabase
				.from('item_behaviors')
				.insert({ ...behavior, scenario_id: currentScenarioId })
				.select()
				.single<ItemBehavior>();

			if (error) throw error;

			itemBehaviorStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as ItemBehaviorId] = data;
				})
			);

			return data;
		},

		async update(id: ItemBehaviorId, behavior: ItemBehaviorUpdate) {
			const { error } = await supabase.from('item_behaviors').update(behavior).eq('id', id);

			if (error) throw error;

			itemBehaviorStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data[id]) {
						Object.assign(draft.data[id], behavior);
					}
				})
			);
		},

		async remove(id: ItemBehaviorId) {
			const { error } = await supabase.from('item_behaviors').delete().eq('id', id);

			if (error) throw error;

			itemBehaviorStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
				})
			);

			// Also remove related actions from the store
			itemBehaviorActionStore.update((state) =>
				produce(state, (draft) => {
					for (const actionId of Object.keys(draft.data) as ItemBehaviorActionId[]) {
						if (draft.data[actionId]?.behavior_id === id) {
							delete draft.data[actionId];
						}
					}
				})
			);
		},

		// ItemBehaviorAction CRUD
		async createItemBehaviorAction(action: Omit<ItemBehaviorActionInsert, 'scenario_id'>) {
			if (!currentScenarioId) {
				throw new Error('useItemBehavior: currentScenarioId is not set.');
			}

			// 해당 behavior에 첫 번째 액션이면 자동으로 root로 설정
			const existingActions = Object.values(get(itemBehaviorActionStore).data);
			const isFirstAction = !existingActions.some((a) => a.behavior_id === action.behavior_id);

			const { data, error } = await supabase
				.from('item_behavior_actions')
				.insert({ ...action, scenario_id: currentScenarioId, root: isFirstAction })
				.select()
				.single<ItemBehaviorAction>();

			if (error) throw error;

			itemBehaviorActionStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as ItemBehaviorActionId] = data;
				})
			);

			return data;
		},

		async updateItemBehaviorAction(id: ItemBehaviorActionId, action: ItemBehaviorActionUpdate) {
			const { error } = await supabase.from('item_behavior_actions').update(action).eq('id', id);

			if (error) throw error;

			itemBehaviorActionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data[id]) {
						Object.assign(draft.data[id], action);
					}
				})
			);
		},

		async removeItemBehaviorAction(id: ItemBehaviorActionId) {
			const { error } = await supabase.from('item_behavior_actions').delete().eq('id', id);

			if (error) throw error;

			itemBehaviorActionStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
				})
			);
		},
	};

	return {
		itemBehaviorStore: itemBehaviorStore as Readable<
			RecordFetchState<ItemBehaviorId, ItemBehavior>
		>,
		itemBehaviorActionStore: itemBehaviorActionStore as Readable<
			RecordFetchState<ItemBehaviorActionId, ItemBehaviorAction>
		>,
		dialogStore: dialogStore as Readable<ItemBehaviorDialogState>,
		init,
		fetch,
		openDialog,
		closeDialog,
		admin,
	};
}

export function useItemBehavior() {
	if (!instance) {
		instance = createItemBehaviorStore();
	}
	return instance;
}

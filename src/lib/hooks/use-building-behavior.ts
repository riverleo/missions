import { get, writable, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	BuildingBehavior,
	BuildingBehaviorInsert,
	BuildingBehaviorUpdate,
	BuildingBehaviorAction,
	BuildingBehaviorActionInsert,
	BuildingBehaviorActionUpdate,
	BuildingBehaviorId,
	BuildingBehaviorActionId,
	ScenarioId,
} from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';

type BuildingBehaviorDialogState =
	| { type: 'create' }
	| { type: 'update'; behaviorId: BuildingBehaviorId }
	| { type: 'delete'; behaviorId: BuildingBehaviorId }
	| undefined;

let instance: ReturnType<typeof createBuildingBehaviorStore> | null = null;

function createBuildingBehaviorStore() {
	const { supabase } = useServerPayload();

	const buildingBehaviorStore = writable<RecordFetchState<BuildingBehaviorId, BuildingBehavior>>({
		status: 'idle',
		data: {},
	});

	const buildingBehaviorActionStore = writable<
		RecordFetchState<BuildingBehaviorActionId, BuildingBehaviorAction>
	>({
		status: 'idle',
		data: {},
	});

	const dialogStore = writable<BuildingBehaviorDialogState>(undefined);

	let currentScenarioId: ScenarioId | undefined;

	async function fetch(scenarioId: ScenarioId) {
		currentScenarioId = scenarioId;

		buildingBehaviorStore.update((state) => ({ ...state, status: 'loading' }));
		buildingBehaviorActionStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			const [behaviorsResult, actionsResult] = await Promise.all([
				supabase.from('building_behaviors').select('*').eq('scenario_id', scenarioId),
				supabase.from('building_behavior_actions').select('*').eq('scenario_id', scenarioId),
			]);

			if (behaviorsResult.error) throw behaviorsResult.error;
			if (actionsResult.error) throw actionsResult.error;

			const behaviorRecord: Record<BuildingBehaviorId, BuildingBehavior> = {};
			for (const item of behaviorsResult.data ?? []) {
				behaviorRecord[item.id as BuildingBehaviorId] = item as BuildingBehavior;
			}

			const actionRecord: Record<BuildingBehaviorActionId, BuildingBehaviorAction> = {};
			for (const item of actionsResult.data ?? []) {
				actionRecord[item.id as BuildingBehaviorActionId] = item as BuildingBehaviorAction;
			}

			buildingBehaviorStore.set({ status: 'success', data: behaviorRecord });
			buildingBehaviorActionStore.set({ status: 'success', data: actionRecord });
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			buildingBehaviorStore.set({ status: 'error', data: {}, error: err });
			buildingBehaviorActionStore.set({ status: 'error', data: {}, error: err });
		}
	}

	function openDialog(state: NonNullable<BuildingBehaviorDialogState>) {
		dialogStore.set(state);
	}

	function closeDialog() {
		dialogStore.set(undefined);
	}

	const admin = {
		// BuildingBehavior CRUD
		async create(behavior: Omit<BuildingBehaviorInsert, 'scenario_id'>) {
			if (!currentScenarioId) {
				throw new Error('useBuildingBehavior: currentScenarioId is not set.');
			}

			const { data, error } = await supabase
				.from('building_behaviors')
				.insert({ ...behavior, scenario_id: currentScenarioId })
				.select()
				.single<BuildingBehavior>();

			if (error) throw error;

			buildingBehaviorStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as BuildingBehaviorId] = data;
				})
			);

			return data;
		},

		async update(id: BuildingBehaviorId, behavior: BuildingBehaviorUpdate) {
			const { error } = await supabase.from('building_behaviors').update(behavior).eq('id', id);

			if (error) throw error;

			buildingBehaviorStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data[id]) {
						Object.assign(draft.data[id], behavior);
					}
				})
			);
		},

		async remove(id: BuildingBehaviorId) {
			const { error } = await supabase.from('building_behaviors').delete().eq('id', id);

			if (error) throw error;

			buildingBehaviorStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
				})
			);

			// Also remove related actions from the store
			buildingBehaviorActionStore.update((state) =>
				produce(state, (draft) => {
					for (const actionId of Object.keys(draft.data) as BuildingBehaviorActionId[]) {
						if (draft.data[actionId]?.behavior_id === id) {
							delete draft.data[actionId];
						}
					}
				})
			);
		},

		// BuildingBehaviorAction CRUD
		async createBuildingBehaviorAction(action: Omit<BuildingBehaviorActionInsert, 'scenario_id'>) {
			if (!currentScenarioId) {
				throw new Error('useBuildingBehavior: currentScenarioId is not set.');
			}

			// 해당 behavior에 첫 번째 액션이면 자동으로 root로 설정
			const existingActions = Object.values(get(buildingBehaviorActionStore).data);
			const isFirstAction = !existingActions.some((a) => a.behavior_id === action.behavior_id);

			const { data, error } = await supabase
				.from('building_behavior_actions')
				.insert({ ...action, scenario_id: currentScenarioId, root: isFirstAction })
				.select()
				.single<BuildingBehaviorAction>();

			if (error) throw error;

			buildingBehaviorActionStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as BuildingBehaviorActionId] = data;
				})
			);

			return data;
		},

		async updateBuildingBehaviorAction(id: BuildingBehaviorActionId, action: BuildingBehaviorActionUpdate) {
			const { error } = await supabase
				.from('building_behavior_actions')
				.update(action)
				.eq('id', id);

			if (error) throw error;

			buildingBehaviorActionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data[id]) {
						Object.assign(draft.data[id], action);
					}
				})
			);
		},

		async removeBuildingBehaviorAction(id: BuildingBehaviorActionId) {
			const { error } = await supabase.from('building_behavior_actions').delete().eq('id', id);

			if (error) throw error;

			buildingBehaviorActionStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
				})
			);
		},
	};

	return {
		buildingBehaviorStore: buildingBehaviorStore as Readable<
			RecordFetchState<BuildingBehaviorId, BuildingBehavior>
		>,
		buildingBehaviorActionStore: buildingBehaviorActionStore as Readable<
			RecordFetchState<BuildingBehaviorActionId, BuildingBehaviorAction>
		>,
		dialogStore: dialogStore as Readable<BuildingBehaviorDialogState>,
		fetch,
		openDialog,
		closeDialog,
		admin,
	};
}

export function useBuildingBehavior() {
	if (!instance) {
		instance = createBuildingBehaviorStore();
	}
	return instance;
}

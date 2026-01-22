import { writable, get, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	Building,
	BuildingInsert,
	BuildingUpdate,
	BuildingState,
	BuildingStateInsert,
	BuildingStateUpdate,
	BuildingInteraction,
	BuildingInteractionInsert,
	BuildingInteractionUpdate,
	BuildingInteractionAction,
	BuildingInteractionActionInsert,
	BuildingInteractionActionUpdate,
	BuildingId,
	BuildingStateId,
	BuildingInteractionId,
	BuildingInteractionActionId,
	ScenarioId,
} from '$lib/types';
import { useApp } from './use-app.svelte';

type BuildingDialogState =
	| { type: 'create' }
	| { type: 'update'; buildingId: BuildingId }
	| { type: 'delete'; buildingId: BuildingId }
	| undefined;

type BuildingInteractionDialogState =
	| { type: 'create' }
	| { type: 'update'; interactionId: BuildingInteractionId }
	| { type: 'delete'; interactionId: BuildingInteractionId }
	| undefined;

let instance: ReturnType<typeof createBuildingStore> | null = null;

function createBuildingStore() {
	const { supabase } = useApp();

	const buildingStore = writable<RecordFetchState<BuildingId, Building>>({
		status: 'idle',
		data: {},
	});

	// building_id를 키로, 해당 빌딩의 states 배열을 값으로
	const buildingStateStore = writable<RecordFetchState<BuildingId, BuildingState[]>>({
		status: 'idle',
		data: {},
	});

	// building_interaction_id를 키로 관리
	const buildingInteractionStore = writable<
		RecordFetchState<BuildingInteractionId, BuildingInteraction>
	>({
		status: 'idle',
		data: {},
	});

	// building_interaction_id를 키로, 해당 interaction의 actions 배열을 값으로
	const buildingInteractionActionStore = writable<
		RecordFetchState<BuildingInteractionId, BuildingInteractionAction[]>
	>({
		status: 'idle',
		data: {},
	});

	const buildingDialogStore = writable<BuildingDialogState>(undefined);
	const buildingInteractionDialogStore = writable<BuildingInteractionDialogState>(undefined);

	const uiStore = writable({
		showBodyPreview: false,
	});

	let initialized = false;

	function init() {
		initialized = true;
	}

	async function fetch() {
		if (!initialized) {
			throw new Error('useBuilding not initialized. Call init() first.');
		}

		buildingStore.update((state) => ({ ...state, status: 'loading' }));
		buildingInteractionStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			// Buildings and states
			const { data: buildingsData, error: buildingsError } = await supabase
				.from('buildings')
				.select('*, building_states(*)')
				.order('name');

			if (buildingsError) throw buildingsError;

			const buildingRecord: Record<BuildingId, Building> = {};
			const stateRecord: Record<BuildingId, BuildingState[]> = {};

			for (const item of buildingsData ?? []) {
				const { building_states, ...building } = item;
				buildingRecord[item.id as BuildingId] = building as Building;
				stateRecord[item.id as BuildingId] = (building_states ?? []) as BuildingState[];
			}

			// Building interactions and actions
			const { data: interactionsData, error: interactionsError } = await supabase
				.from('building_interactions')
				.select('*, building_interaction_actions(*)')
				.order('created_at');

			if (interactionsError) throw interactionsError;

			const interactionRecord: Record<BuildingInteractionId, BuildingInteraction> = {};
			const actionRecord: Record<BuildingInteractionId, BuildingInteractionAction[]> = {};

			for (const item of interactionsData ?? []) {
				const { building_interaction_actions, ...interaction } = item;
				interactionRecord[item.id as BuildingInteractionId] = interaction as BuildingInteraction;
				actionRecord[item.id as BuildingInteractionId] = (building_interaction_actions ??
					[]) as BuildingInteractionAction[];
			}

			buildingStore.set({
				status: 'success',
				data: buildingRecord,
				error: undefined,
			});

			buildingStateStore.set({
				status: 'success',
				data: stateRecord,
				error: undefined,
			});

			buildingInteractionStore.set({
				status: 'success',
				data: interactionRecord,
				error: undefined,
			});

			buildingInteractionActionStore.set({
				status: 'success',
				data: actionRecord,
				error: undefined,
			});
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			buildingStore.set({
				status: 'error',
				data: {},
				error: err,
			});
			buildingStateStore.set({
				status: 'error',
				data: {},
				error: err,
			});
			buildingInteractionStore.set({
				status: 'error',
				data: {},
				error: err,
			});
			buildingInteractionActionStore.set({
				status: 'error',
				data: {},
				error: err,
			});
		}
	}

	function openBuildingDialog(state: NonNullable<BuildingDialogState>) {
		buildingDialogStore.set(state);
	}

	function closeBuildingDialog() {
		buildingDialogStore.set(undefined);
	}

	function openBuildingInteractionDialog(state: NonNullable<BuildingInteractionDialogState>) {
		buildingInteractionDialogStore.set(state);
	}

	function closeBuildingInteractionDialog() {
		buildingInteractionDialogStore.set(undefined);
	}

	const admin = {
		uiStore: uiStore as Readable<{ showBodyPreview: boolean }>,

		setShowBodyPreview(value: boolean) {
			uiStore.update((s) => ({ ...s, showBodyPreview: value }));
		},

		async createBuilding(scenarioId: ScenarioId, building: Omit<BuildingInsert, 'scenario_id'>) {
			const { data, error } = await supabase
				.from('buildings')
				.insert({
					...building,
					scenario_id: scenarioId,
				})
				.select('*')
				.single<Building>();

			if (error) throw error;

			buildingStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as BuildingId] = data;
				})
			);

			buildingStateStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as BuildingId] = [];
				})
			);

			return data;
		},

		async updateBuilding(id: BuildingId, building: BuildingUpdate) {
			const { error } = await supabase.from('buildings').update(building).eq('id', id);

			if (error) throw error;

			buildingStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], building);
					}
				})
			);
		},

		async removeBuilding(id: BuildingId) {
			const { error } = await supabase.from('buildings').delete().eq('id', id);

			if (error) throw error;

			buildingStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);

			buildingStateStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);
		},

		async createBuildingState(
			buildingId: BuildingId,
			state: Omit<BuildingStateInsert, 'building_id'>
		) {
			const { data, error } = await supabase
				.from('building_states')
				.insert({
					...state,
					building_id: buildingId,
				})
				.select()
				.single<BuildingState>();

			if (error) throw error;

			buildingStateStore.update((s) =>
				produce(s, (draft) => {
					if (draft.data[buildingId]) {
						draft.data[buildingId].push(data);
					} else {
						draft.data[buildingId] = [data];
					}
				})
			);

			return data;
		},

		async updateBuildingState(
			stateId: BuildingStateId,
			buildingId: BuildingId,
			updates: BuildingStateUpdate
		) {
			const { error } = await supabase.from('building_states').update(updates).eq('id', stateId);

			if (error) throw error;

			buildingStateStore.update((s) =>
				produce(s, (draft) => {
					const states = draft.data[buildingId];
					if (states) {
						const state = states.find((bs) => bs.id === stateId);
						if (state) {
							Object.assign(state, updates);
						}
					}
				})
			);
		},

		async removeBuildingState(stateId: BuildingStateId, buildingId: BuildingId) {
			const { error } = await supabase.from('building_states').delete().eq('id', stateId);

			if (error) throw error;

			buildingStateStore.update((s) =>
				produce(s, (draft) => {
					const states = draft.data[buildingId];
					if (states) {
						draft.data[buildingId] = states.filter((bs) => bs.id !== stateId);
					}
				})
			);
		},

		async createBuildingInteraction(scenarioId: ScenarioId, interaction: Omit<BuildingInteractionInsert, 'scenario_id'>) {
			const { data, error } = await supabase
				.from('building_interactions')
				.insert({
					...interaction,
					scenario_id: scenarioId,
				})
				.select('*')
				.single<BuildingInteraction>();

			if (error) throw error;

			buildingInteractionStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as BuildingInteractionId] = data;
				})
			);

			buildingInteractionActionStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as BuildingInteractionId] = [];
				})
			);

			return data;
		},

		async updateBuildingInteraction(id: BuildingInteractionId, updates: BuildingInteractionUpdate) {
			const { error } = await supabase.from('building_interactions').update(updates).eq('id', id);

			if (error) throw error;

			buildingInteractionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], updates);
					}
				})
			);
		},

		async removeBuildingInteraction(id: BuildingInteractionId) {
			const { error } = await supabase.from('building_interactions').delete().eq('id', id);

			if (error) throw error;

			buildingInteractionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);

			buildingInteractionActionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);
		},

		async createBuildingInteractionAction(
			scenarioId: ScenarioId,
			interactionId: BuildingInteractionId,
			action: Omit<
				BuildingInteractionActionInsert,
				'scenario_id' | 'building_id' | 'building_interaction_id'
			>
		) {
			// Get building_id from interaction
			const buildingInteractionStoreValue = get(buildingInteractionStore);
			const buildingId = buildingInteractionStoreValue.data[interactionId]?.building_id;

			if (!buildingId) {
				throw new Error('Cannot find building_id for this interaction');
			}

			const { data, error } = await supabase
				.from('building_interaction_actions')
				.insert({
					...action,
					scenario_id: scenarioId,
					building_id: buildingId,
					building_interaction_id: interactionId,
				})
				.select()
				.single<BuildingInteractionAction>();

			if (error) throw error;

			buildingInteractionActionStore.update((s) =>
				produce(s, (draft) => {
					if (draft.data[interactionId]) {
						draft.data[interactionId].push(data);
					} else {
						draft.data[interactionId] = [data];
					}
				})
			);

			return data;
		},

		async updateBuildingInteractionAction(
			actionId: BuildingInteractionActionId,
			interactionId: BuildingInteractionId,
			updates: BuildingInteractionActionUpdate
		) {
			const { error } = await supabase
				.from('building_interaction_actions')
				.update(updates)
				.eq('id', actionId);

			if (error) throw error;

			buildingInteractionActionStore.update((s) =>
				produce(s, (draft) => {
					const actions = draft.data[interactionId];
					if (actions) {
						const action = actions.find((a) => a.id === actionId);
						if (action) {
							Object.assign(action, updates);
						}
					}
				})
			);
		},

		async removeBuildingInteractionAction(
			actionId: BuildingInteractionActionId,
			interactionId: BuildingInteractionId
		) {
			const { error } = await supabase
				.from('building_interaction_actions')
				.delete()
				.eq('id', actionId);

			if (error) throw error;

			buildingInteractionActionStore.update((s) =>
				produce(s, (draft) => {
					const actions = draft.data[interactionId];
					if (actions) {
						draft.data[interactionId] = actions.filter((a) => a.id !== actionId);
					}
				})
			);
		},
	};

	return {
		buildingStore: buildingStore as Readable<RecordFetchState<BuildingId, Building>>,
		buildingStateStore: buildingStateStore as Readable<
			RecordFetchState<BuildingId, BuildingState[]>
		>,
		buildingInteractionStore: buildingInteractionStore as Readable<
			RecordFetchState<BuildingInteractionId, BuildingInteraction>
		>,
		buildingInteractionActionStore: buildingInteractionActionStore as Readable<
			RecordFetchState<BuildingInteractionId, BuildingInteractionAction[]>
		>,
		buildingDialogStore: buildingDialogStore as Readable<BuildingDialogState>,
		buildingInteractionDialogStore:
			buildingInteractionDialogStore as Readable<BuildingInteractionDialogState>,
		init,
		fetch,
		openBuildingDialog,
		closeBuildingDialog,
		openBuildingInteractionDialog,
		closeBuildingInteractionDialog,
		admin,
	};
}

export function useBuilding() {
	if (!instance) {
		instance = createBuildingStore();
	}
	return instance;
}

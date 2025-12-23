import { writable, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	Building,
	BuildingInsert,
	BuildingUpdate,
	BuildingState,
	BuildingStateInsert,
	BuildingStateUpdate,
} from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';

type BuildingDialogState =
	| { type: 'create' }
	| { type: 'delete'; buildingId: string }
	| undefined;

let instance: ReturnType<typeof createBuildingStore> | null = null;

function createBuildingStore() {
	const { supabase } = useServerPayload();

	const store = writable<RecordFetchState<Building>>({
		status: 'idle',
		data: {},
	});

	// building_id를 키로, 해당 빌딩의 states 배열을 값으로
	const stateStore = writable<RecordFetchState<BuildingState[]>>({
		status: 'idle',
		data: {},
	});

	const dialogStore = writable<BuildingDialogState>(undefined);

	const uiStore = writable({
		showBodyPreview: false,
	});

	let currentScenarioId: string | undefined;

	async function fetch(scenarioId: string) {
		currentScenarioId = scenarioId;

		store.update((state) => ({ ...state, status: 'loading' }));

		try {
			const { data, error } = await supabase
				.from('buildings')
				.select('*, building_states(*)')
				.eq('scenario_id', scenarioId)
				.order('name');

			if (error) throw error;

			const buildingRecord: Record<string, Building> = {};
			const stateRecord: Record<string, BuildingState[]> = {};

			for (const item of data ?? []) {
				const { building_states, ...building } = item;
				buildingRecord[item.id] = building;
				stateRecord[item.id] = building_states ?? [];
			}

			store.set({
				status: 'success',
				data: buildingRecord,
				error: undefined,
			});

			stateStore.set({
				status: 'success',
				data: stateRecord,
				error: undefined,
			});
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			store.set({
				status: 'error',
				data: {},
				error: err,
			});
			stateStore.set({
				status: 'error',
				data: {},
				error: err,
			});
		}
	}

	function openDialog(state: NonNullable<BuildingDialogState>) {
		dialogStore.set(state);
	}

	function closeDialog() {
		dialogStore.set(undefined);
	}

	const admin = {
		uiStore: uiStore as Readable<{ showBodyPreview: boolean }>,

		setShowBodyPreview(value: boolean) {
			uiStore.update((s) => ({ ...s, showBodyPreview: value }));
		},

		async create(building: Omit<BuildingInsert, 'scenario_id'>) {
			if (!currentScenarioId) {
				throw new Error('useBuilding: currentScenarioId is not set.');
			}

			const { data, error } = await supabase
				.from('buildings')
				.insert({
					...building,
					scenario_id: currentScenarioId,
				})
				.select('*')
				.single();

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id] = data;
				})
			);

			stateStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id] = [];
				})
			);

			return data;
		},

		async update(id: string, building: BuildingUpdate) {
			const { error } = await supabase.from('buildings').update(building).eq('id', id);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], building);
					}
				})
			);
		},

		async remove(id: string) {
			const { error } = await supabase.from('buildings').delete().eq('id', id);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);

			stateStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);
		},

		async createBuildingState(buildingId: string, state: Omit<BuildingStateInsert, 'building_id'>) {
			const { data, error } = await supabase
				.from('building_states')
				.insert({
					...state,
					building_id: buildingId,
				})
				.select()
				.single();

			if (error) throw error;

			stateStore.update((s) =>
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

		async updateBuildingState(stateId: string, buildingId: string, updates: BuildingStateUpdate) {
			const { error } = await supabase
				.from('building_states')
				.update(updates)
				.eq('id', stateId);

			if (error) throw error;

			stateStore.update((s) =>
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

		async removeBuildingState(stateId: string, buildingId: string) {
			const { error } = await supabase.from('building_states').delete().eq('id', stateId);

			if (error) throw error;

			stateStore.update((s) =>
				produce(s, (draft) => {
					const states = draft.data[buildingId];
					if (states) {
						draft.data[buildingId] = states.filter((bs) => bs.id !== stateId);
					}
				})
			);
		},
	};

	return {
		store: store as Readable<RecordFetchState<Building>>,
		stateStore: stateStore as Readable<RecordFetchState<BuildingState[]>>,
		dialogStore: dialogStore as Readable<BuildingDialogState>,
		fetch,
		openDialog,
		closeDialog,
		admin,
	};
}

export function useBuilding() {
	if (!instance) {
		instance = createBuildingStore();
	}
	return instance;
}

import { writable, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	Building,
	BuildingInsert,
	BuildingUpdate,
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

	const dialogStore = writable<BuildingDialogState>(undefined);

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

			const record: Record<string, Building> = {};
			for (const item of data ?? []) {
				record[item.id] = item;
			}

			store.set({
				status: 'success',
				data: record,
				error: undefined,
			});
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			store.set({
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
				.select('*, building_states(*)')
				.single();

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id] = data;
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

			store.update((s) =>
				produce(s, (draft) => {
					const building = draft.data[buildingId];
					if (building) {
						building.building_states.push(data);
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

			store.update((s) =>
				produce(s, (draft) => {
					const building = draft.data[buildingId];
					if (building) {
						const state = building.building_states.find((bs) => bs.id === stateId);
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

			store.update((s) =>
				produce(s, (draft) => {
					const building = draft.data[buildingId];
					if (building) {
						building.building_states = building.building_states.filter(
							(bs) => bs.id !== stateId
						);
					}
				})
			);
		},
	};

	return {
		store: store as Readable<RecordFetchState<Building>>,
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

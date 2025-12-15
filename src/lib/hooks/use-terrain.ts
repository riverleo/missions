import { writable, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type { RecordFetchState, Terrain, TerrainInsert, TerrainUpdate } from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';

type TerrainDialogState =
	| { type: 'create' }
	| { type: 'delete'; terrainId: string }
	| undefined;

let instance: ReturnType<typeof createTerrainStore> | null = null;

function createTerrainStore() {
	const { supabase } = useServerPayload();

	const store = writable<RecordFetchState<Terrain>>({
		status: 'idle',
		data: {},
	});

	const dialogStore = writable<TerrainDialogState>(undefined);

	let currentScenarioId: string | undefined;

	async function fetch(scenarioId: string) {
		currentScenarioId = scenarioId;

		store.update((state) => ({ ...state, status: 'loading' }));

		try {
			const { data, error } = await supabase
				.from('terrains')
				.select('*')
				.eq('scenario_id', scenarioId)
				.order('display_order');

			if (error) throw error;

			const record: Record<string, Terrain> = {};
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

	function openDialog(state: NonNullable<TerrainDialogState>) {
		dialogStore.set(state);
	}

	function closeDialog() {
		dialogStore.set(undefined);
	}

	const admin = {
		async create(terrain: Omit<TerrainInsert, 'scenario_id'>) {
			if (!currentScenarioId) {
				throw new Error('useTerrain: currentScenarioId is not set.');
			}

			const { data, error } = await supabase
				.from('terrains')
				.insert({
					...terrain,
					scenario_id: currentScenarioId,
				})
				.select()
				.single();

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id] = data;
				})
			);

			return data;
		},

		async update(id: string, terrain: TerrainUpdate) {
			const { error } = await supabase.from('terrains').update(terrain).eq('id', id);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], terrain);
					}
				})
			);
		},

		async remove(id: string) {
			const { error } = await supabase.from('terrains').delete().eq('id', id);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);
		},
	};

	return {
		store: store as Readable<RecordFetchState<Terrain>>,
		dialogStore: dialogStore as Readable<TerrainDialogState>,
		fetch,
		openDialog,
		closeDialog,
		admin,
	};
}

export function useTerrain() {
	if (!instance) {
		instance = createTerrainStore();
	}
	return instance;
}

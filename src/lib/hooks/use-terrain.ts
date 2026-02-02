import { writable, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	Terrain,
	TerrainInsert,
	TerrainUpdate,
	TerrainId,
	Tile,
	TileInsert,
	TileUpdate,
	TileId,
	TileState,
	TileStateInsert,
	TileStateUpdate,
	TileStateId,
	TerrainTile,
	TerrainTileInsert,
	TerrainTileUpdate,
	TerrainTileId,
	ScenarioId,
} from '$lib/types';
import { useApp } from './use-app.svelte';

type TerrainDialogState = { type: 'create' } | { type: 'delete'; terrainId: TerrainId } | undefined;

type TileDialogState =
	| { type: 'create' }
	| { type: 'update'; tileId: TileId }
	| { type: 'delete'; tileId: TileId }
	| undefined;

type TileStateDialogState = { type: 'update'; tileStateId: TileStateId } | undefined;

let instance: ReturnType<typeof createTerrainStore> | null = null;

function createTerrainStore() {
	const { supabase } = useApp();

	const terrainStore = writable<RecordFetchState<TerrainId, Terrain>>({
		status: 'idle',
		data: {},
	});

	const terrainDialogStore = writable<TerrainDialogState>(undefined);

	const tileStore = writable<RecordFetchState<TileId, Tile>>({
		status: 'idle',
		data: {},
	});

	const tileDialogStore = writable<TileDialogState>(undefined);

	const tileStateStore = writable<RecordFetchState<TileId, TileState[]>>({
		status: 'idle',
		data: {},
	});

	const tileStateDialogStore = writable<TileStateDialogState>(undefined);

	const terrainTileStore = writable<RecordFetchState<TerrainTileId, TerrainTile>>({
		status: 'idle',
		data: {},
	});

	// 어드민 UI 상태
	const terrainUiStore = writable({
		isSettingStartMarker: false,
	});

	let initialized = false;

	function init() {
		initialized = true;
	}

	async function fetch() {
		if (!initialized) {
			throw new Error('useTerrain not initialized. Call init() first.');
		}

		terrainStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			const { data, error } = await supabase.from('terrains').select('*').order('display_order');

			if (error) throw error;

			const record: Record<TerrainId, Terrain> = {};
			for (const item of data ?? []) {
				record[item.id as TerrainId] = item as Terrain;
			}

			terrainStore.set({
				status: 'success',
				data: record,
				error: undefined,
			});
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			terrainStore.set({
				status: 'error',
				data: {},
				error: err,
			});
		}
	}

	function openTerrainDialog(state: NonNullable<TerrainDialogState>) {
		terrainDialogStore.set(state);
	}

	function closeTerrainDialog() {
		terrainDialogStore.set(undefined);
	}

	async function fetchTiles() {
		if (!initialized) {
			throw new Error('useTerrain not initialized. Call init() first.');
		}

		tileStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			const { data, error } = await supabase.from('tiles').select('*');

			if (error) throw error;

			const record: Record<TileId, Tile> = {};
			for (const item of data ?? []) {
				record[item.id as TileId] = item as Tile;
			}

			tileStore.set({
				status: 'success',
				data: record,
				error: undefined,
			});
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			tileStore.set({
				status: 'error',
				data: {},
				error: err,
			});
		}
	}

	async function fetchTileStates() {
		if (!initialized) {
			throw new Error('useTerrain not initialized. Call init() first.');
		}

		tileStateStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			const { data, error } = await supabase.from('tile_states').select('*');

			if (error) throw error;

			const record: Record<TileId, TileState[]> = {};
			for (const item of data ?? []) {
				const tileId = item.tile_id as TileId;
				if (!record[tileId]) {
					record[tileId] = [];
				}
				record[tileId].push(item as TileState);
			}

			tileStateStore.set({
				status: 'success',
				data: record,
				error: undefined,
			});
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			tileStateStore.set({
				status: 'error',
				data: {},
				error: err,
			});
		}
	}

	async function fetchTerrainTiles() {
		if (!initialized) {
			throw new Error('useTerrain not initialized. Call init() first.');
		}

		terrainTileStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			const { data, error } = await supabase.from('terrains_tiles').select('*');

			if (error) throw error;

			const record: Record<TerrainTileId, TerrainTile> = {};
			for (const item of data ?? []) {
				record[item.id as TerrainTileId] = item as TerrainTile;
			}

			terrainTileStore.set({
				status: 'success',
				data: record,
				error: undefined,
			});
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			terrainTileStore.set({
				status: 'error',
				data: {},
				error: err,
			});
		}
	}

	function openTileDialog(state: NonNullable<TileDialogState>) {
		tileDialogStore.set(state);
	}

	function closeTileDialog() {
		tileDialogStore.set(undefined);
	}

	function openTileStateDialog(state: NonNullable<TileStateDialogState>) {
		tileStateDialogStore.set(state);
	}

	function closeTileStateDialog() {
		tileStateDialogStore.set(undefined);
	}

	const admin = {
		terrainUiStore: terrainUiStore as Readable<{ isSettingStartMarker: boolean }>,

		setSettingStartMarker(value: boolean) {
			terrainUiStore.update((s) => ({ ...s, isSettingStartMarker: value }));
		},

		async createTerrain(scenarioId: ScenarioId, terrain: Omit<TerrainInsert, 'scenario_id'>) {
			const { data, error } = await supabase
				.from('terrains')
				.insert({
					...terrain,
					scenario_id: scenarioId,
				})
				.select()
				.single<Terrain>();

			if (error) throw error;

			terrainStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as TerrainId] = data;
				})
			);

			return data;
		},

		async updateTerrain(id: TerrainId, terrain: TerrainUpdate) {
			const { error } = await supabase.from('terrains').update(terrain).eq('id', id);

			if (error) throw error;

			terrainStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], terrain);
					}
				})
			);
		},

		async removeTerrain(id: TerrainId) {
			const { error } = await supabase.from('terrains').delete().eq('id', id);

			if (error) throw error;

			terrainStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);
		},

		// Tile CRUD operations
		async createTile(scenarioId: ScenarioId, tile: Omit<TileInsert, 'scenario_id'>) {
			const { data, error } = await supabase
				.from('tiles')
				.insert({
					...tile,
					scenario_id: scenarioId,
				})
				.select()
				.single<Tile>();

			if (error) throw error;

			tileStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as TileId] = data;
				})
			);

			return data;
		},

		async updateTile(id: TileId, tile: TileUpdate) {
			const { error } = await supabase.from('tiles').update(tile).eq('id', id);

			if (error) throw error;

			tileStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], tile);
					}
				})
			);
		},

		async removeTile(id: TileId) {
			const { error } = await supabase.from('tiles').delete().eq('id', id);

			if (error) throw error;

			tileStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);
		},

		// TileState CRUD operations
		async createTileState(
			scenarioId: ScenarioId,
			tileId: TileId,
			tileState: Omit<TileStateInsert, 'tile_id' | 'scenario_id'>
		) {
			const { data, error } = await supabase
				.from('tile_states')
				.insert({
					...tileState,
					scenario_id: scenarioId,
					tile_id: tileId,
				})
				.select()
				.single<TileState>();

			if (error) throw error;

			tileStateStore.update((state) =>
				produce(state, (draft) => {
					if (!draft.data[tileId]) {
						draft.data[tileId] = [];
					}
					draft.data[tileId].push(data);
				})
			);

			return data;
		},

		async updateTileState(id: TileStateId, tileId: TileId, tileState: TileStateUpdate) {
			const { error } = await supabase.from('tile_states').update(tileState).eq('id', id);

			if (error) throw error;

			tileStateStore.update((state) =>
				produce(state, (draft) => {
					const states = draft.data[tileId];
					if (states) {
						const state = states.find((s) => s.id === id);
						if (state) {
							Object.assign(state, tileState);
						}
					}
				})
			);
		},

		async removeTileState(id: TileStateId, tileId: TileId) {
			const { error } = await supabase.from('tile_states').delete().eq('id', id);

			if (error) throw error;

			tileStateStore.update((state) =>
				produce(state, (draft) => {
					const states = draft.data[tileId];
					if (states) {
						const index = states.findIndex((s) => s.id === id);
						if (index !== -1) {
							states.splice(index, 1);
						}
					}
				})
			);
		},

		// TerrainTile CRUD operations
		async createTerrainTile(
			scenarioId: ScenarioId,
			terrainTile: Omit<TerrainTileInsert, 'scenario_id'>
		) {
			const { data, error } = await supabase
				.from('terrains_tiles')
				.insert({
					...terrainTile,
					scenario_id: scenarioId,
				})
				.select()
				.single<TerrainTile>();

			if (error) throw error;

			terrainTileStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as TerrainTileId] = data;
				})
			);

			return data;
		},

		async updateTerrainTile(id: TerrainTileId, terrainTile: TerrainTileUpdate) {
			const { error } = await supabase.from('terrains_tiles').update(terrainTile).eq('id', id);

			if (error) throw error;

			terrainTileStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], terrainTile);
					}
				})
			);
		},

		async removeTerrainTile(id: TerrainTileId) {
			const { error } = await supabase.from('terrains_tiles').delete().eq('id', id);

			if (error) throw error;

			terrainTileStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);
		},
	};

	return {
		terrainStore: terrainStore as Readable<RecordFetchState<TerrainId, Terrain>>,
		terrainDialogStore: terrainDialogStore as Readable<TerrainDialogState>,
		tileStore: tileStore as Readable<RecordFetchState<TileId, Tile>>,
		tileDialogStore: tileDialogStore as Readable<TileDialogState>,
		tileStateStore: tileStateStore as Readable<RecordFetchState<TileId, TileState[]>>,
		tileStateDialogStore: tileStateDialogStore as Readable<TileStateDialogState>,
		terrainTileStore: terrainTileStore as Readable<RecordFetchState<TerrainTileId, TerrainTile>>,
		init,
		fetch,
		fetchTiles,
		fetchTileStates,
		fetchTerrainTiles,
		openTerrainDialog,
		closeTerrainDialog,
		openTileDialog,
		closeTileDialog,
		openTileStateDialog,
		closeTileStateDialog,
		admin,
	};
}

export function useTerrain() {
	if (!instance) {
		instance = createTerrainStore();
	}
	return instance;
}

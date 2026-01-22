import { writable, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	FetchStatus,
	Scenario,
	ScenarioInsert,
	ScenarioUpdate,
	ScenarioId,
} from '$lib/types';
import { useApp } from './use-app.svelte';
import { usePlayer } from './use-player';
import { useQuest } from './use-quest';
import { useChapter } from './use-chapter';
import { useTerrain } from './use-terrain';
import { useCharacter } from './use-character';
import { useBuilding } from './use-building';
import { useNeed } from './use-need';
import { useBehavior } from './use-behavior';
import { useCondition } from './use-condition';
import { useItem } from './use-item';
import { useWorld } from './use-world';

type ScenarioStoreState = RecordFetchState<ScenarioId, Scenario>;

type ScenarioDialogState =
	| { type: 'create' }
	| { type: 'update'; scenarioId: ScenarioId }
	| { type: 'delete'; scenarioId: ScenarioId }
	| { type: 'publish'; scenarioId: ScenarioId }
	| undefined;

let instance: ReturnType<typeof createScenarioStore> | null = null;

function createScenarioStore() {
	const { supabase } = useApp();

	const scenarioStore = writable<ScenarioStoreState>({ status: 'idle', data: {} });
	const fetchAllStatus = writable<FetchStatus>('idle');

	const scenarioDialogStore = writable<ScenarioDialogState>(undefined);

	function openScenarioDialog(state: NonNullable<ScenarioDialogState>) {
		scenarioDialogStore.set(state);
	}

	function closeScenarioDialog() {
		scenarioDialogStore.set(undefined);
	}

	async function fetch() {
		scenarioStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			const { data, error } = await supabase
				.from('scenarios')
				.select('*')
				.order('display_order', { ascending: true });

			if (error) throw error;

			// Convert array to Record
			const record: Record<ScenarioId, Scenario> = {};
			for (const item of data ?? []) {
				record[item.id as ScenarioId] = item as Scenario;
			}

			scenarioStore.update((state) => ({
				...state,
				status: 'success',
				data: record,
				error: undefined,
			}));
		} catch (error) {
			scenarioStore.update((state) => ({
				...state,
				status: 'error',
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
		}
	}

	async function fetchAll(scenarioId: ScenarioId) {
		fetchAllStatus.set('loading');

		try {
			// Player 먼저 초기화 (다른 훅에서 참조 가능하도록)
			const { fetch: fetchPlayer } = usePlayer();
			await fetchPlayer();

			const { fetch: fetchQuest } = useQuest();
			const { fetch: fetchChapter } = useChapter();
			const { fetch: fetchTerrain, fetchTiles, fetchTileStates, fetchTerrainTiles } = useTerrain();
			const { fetch: fetchCharacter } = useCharacter();
			const { fetch: fetchBuilding } = useBuilding();
			const { fetch: fetchNeed } = useNeed();
			const { fetch: fetchBehavior } = useBehavior();
			const { fetch: fetchCondition } = useCondition();
			const { fetch: fetchItem } = useItem();
			const { fetch: fetchWorld } = useWorld();

			await Promise.all([
				fetchQuest(scenarioId),
				fetchChapter(scenarioId),
				fetchTerrain(scenarioId),
				fetchTiles(scenarioId),
				fetchTileStates(scenarioId),
				fetchTerrainTiles(scenarioId),
				fetchCharacter(scenarioId),
				fetchBuilding(scenarioId),
				fetchNeed(scenarioId),
				fetchBehavior(scenarioId),
				fetchCondition(scenarioId),
				fetchItem(scenarioId),
				fetchWorld(),
			]);

			fetchAllStatus.set('success');
		} catch (error) {
			fetchAllStatus.set('error');
			throw error;
		}
	}

	const admin = {
		async createScenario(input: Omit<ScenarioInsert, 'display_order'>) {
			const { data, error } = await supabase
				.from('scenarios')
				.insert(input)
				.select()
				.single<Scenario>();

			if (error) throw error;

			scenarioStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as ScenarioId] = data;
				})
			);

			return data;
		},

		async updateScenario(scenarioId: ScenarioId, input: ScenarioUpdate) {
			const { error } = await supabase.from('scenarios').update(input).eq('id', scenarioId);

			if (error) throw error;

			scenarioStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[scenarioId]) {
						Object.assign(draft.data[scenarioId], input);
					}
				})
			);
		},

		async removeScenario(scenarioId: ScenarioId) {
			const { error } = await supabase.from('scenarios').delete().eq('id', scenarioId);

			if (error) throw error;

			scenarioStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[scenarioId];
					}
				})
			);
		},

		async publishScenario(scenarioId: ScenarioId) {
			const { error } = await supabase
				.from('scenarios')
				.update({ status: 'published' })
				.eq('id', scenarioId);

			if (error) throw error;

			scenarioStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[scenarioId]) {
						draft.data[scenarioId].status = 'published';
					}
				})
			);
		},

		async unpublishScenario(scenarioId: ScenarioId) {
			const { error } = await supabase
				.from('scenarios')
				.update({ status: 'draft' })
				.eq('id', scenarioId);

			if (error) throw error;

			scenarioStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[scenarioId]) {
						draft.data[scenarioId].status = 'draft';
					}
				})
			);
		},
	};

	return {
		scenarioStore: scenarioStore as Readable<ScenarioStoreState>,
		scenarioDialogStore: scenarioDialogStore as Readable<ScenarioDialogState>,
		fetchAllStatus: fetchAllStatus as Readable<FetchStatus>,
		fetch,
		fetchAll,
		openScenarioDialog,
		closeScenarioDialog,
		admin,
	};
}

export function useScenario() {
	if (!instance) {
		instance = createScenarioStore();
	}
	return instance;
}

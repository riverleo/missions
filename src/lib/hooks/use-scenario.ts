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
import { useCharacterBody } from './use-character-body';
import { useBuilding } from './use-building';
import { useNeed } from './use-need';
import { useNeedBehavior } from './use-need-behavior';
import { useConditionBehavior } from './use-condition-behavior';
import { useCondition } from './use-condition';
import { useItem } from './use-item';
import { useItemBehavior } from './use-item-behavior';
import { useBehaviorPriority } from './use-behavior-priority';
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

	const store = writable<ScenarioStoreState>({ status: 'idle', data: {} });
	const fetchAllStatus = writable<FetchStatus>('idle');

	const dialogStore = writable<ScenarioDialogState>(undefined);

	function openDialog(state: NonNullable<ScenarioDialogState>) {
		dialogStore.set(state);
	}

	function closeDialog() {
		dialogStore.set(undefined);
	}

	async function fetch() {
		store.update((state) => ({ ...state, status: 'loading' }));

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

			store.update((state) => ({
				...state,
				status: 'success',
				data: record,
				error: undefined,
			}));
		} catch (error) {
			store.update((state) => ({
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
			await usePlayer().fetch();

			await Promise.all([
				useQuest().fetch(scenarioId),
				useChapter().fetch(scenarioId),
				useTerrain().fetch(scenarioId),
				useTerrain().fetchTiles(scenarioId),
				useTerrain().fetchTileStates(scenarioId),
				useTerrain().fetchTerrainTiles(scenarioId),
				useCharacter().fetch(scenarioId),
				useCharacterBody().fetch(scenarioId),
				useBuilding().fetch(scenarioId),
				useNeed().fetch(scenarioId),
				useNeedBehavior().fetch(scenarioId),
				useConditionBehavior().fetch(scenarioId),
				useCondition().fetch(scenarioId),
				useItem().fetch(scenarioId),
				useItemBehavior().fetch(scenarioId),
				useBehaviorPriority().fetch(scenarioId),
				useWorld().fetch(),
			]);

			fetchAllStatus.set('success');
		} catch (error) {
			fetchAllStatus.set('error');
			throw error;
		}
	}

	const admin = {
		async create(input: Omit<ScenarioInsert, 'display_order'>) {
			const { data, error } = await supabase
				.from('scenarios')
				.insert(input)
				.select()
				.single<Scenario>();

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as ScenarioId] = data;
				})
			);

			return data;
		},

		async update(scenarioId: ScenarioId, input: ScenarioUpdate) {
			const { error } = await supabase.from('scenarios').update(input).eq('id', scenarioId);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[scenarioId]) {
						Object.assign(draft.data[scenarioId], input);
					}
				})
			);
		},

		async remove(scenarioId: ScenarioId) {
			const { error } = await supabase.from('scenarios').delete().eq('id', scenarioId);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[scenarioId];
					}
				})
			);
		},

		async publish(scenarioId: ScenarioId) {
			const { error } = await supabase
				.from('scenarios')
				.update({ status: 'published' })
				.eq('id', scenarioId);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[scenarioId]) {
						draft.data[scenarioId].status = 'published';
					}
				})
			);
		},

		async unpublish(scenarioId: ScenarioId) {
			const { error } = await supabase
				.from('scenarios')
				.update({ status: 'draft' })
				.eq('id', scenarioId);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[scenarioId]) {
						draft.data[scenarioId].status = 'draft';
					}
				})
			);
		},
	};

	return {
		store: store as Readable<ScenarioStoreState>,
		dialogStore: dialogStore as Readable<ScenarioDialogState>,
		fetchAllStatus: fetchAllStatus as Readable<FetchStatus>,
		fetch,
		fetchAll,
		openDialog,
		closeDialog,
		admin,
	};
}

export function useScenario() {
	if (!instance) {
		instance = createScenarioStore();
	}
	return instance;
}

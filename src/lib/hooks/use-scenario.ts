import { writable, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type { RecordFetchState, Scenario, ScenarioInsert, ScenarioUpdate } from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';
import { useQuest } from './use-quest';
import { useChapter } from './use-chapter';
import { useTerrain } from './use-terrain';
import { useCharacter } from './use-character';
import { useCharacterBody } from './use-character-body';
import { useBuilding } from './use-building';
import { useNeed } from './use-need';
import { useNeedBehavior } from './use-need-behavior';
import { useBuildingBehavior } from './use-building-behavior';

type ScenarioStoreState = RecordFetchState<Scenario>;

type ScenarioDialogState =
	| { type: 'create' }
	| { type: 'update'; scenarioId: string }
	| { type: 'delete'; scenarioId: string }
	| { type: 'publish'; scenarioId: string }
	| undefined;

let instance: ReturnType<typeof createScenarioStore> | null = null;

function createScenarioStore() {
	const { supabase } = useServerPayload();

	const store = writable<ScenarioStoreState>({ status: 'idle', data: {} });

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
			const record: Record<string, Scenario> = {};
			for (const item of data ?? []) {
				record[item.id] = item;
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

	async function init(scenarioId: string) {
		await Promise.all([
			useQuest().fetch(scenarioId),
			useChapter().fetch(scenarioId),
			useTerrain().fetch(scenarioId),
			useCharacter().fetch(scenarioId),
			useCharacterBody().fetch(scenarioId),
			useBuilding().fetch(scenarioId),
			useNeed().fetch(scenarioId),
			useNeedBehavior().fetch(scenarioId),
			useBuildingBehavior().fetch(scenarioId),
		]);
	}

	const admin = {
		async create(input: Omit<ScenarioInsert, 'display_order'>) {
			const { data, error } = await supabase.from('scenarios').insert(input).select().single();

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id] = data;
				})
			);

			return data;
		},

		async update(scenarioId: string, input: ScenarioUpdate) {
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

		async remove(scenarioId: string) {
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

		async publish(scenarioId: string) {
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

		async unpublish(scenarioId: string) {
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
		fetch,
		init,
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

import { writable, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type { FetchState, Scenario, ScenarioInsert, ScenarioUpdate } from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';
import { useScenarioQuest } from './use-scenario-quest';
import { useScenarioChapter } from './use-scenario-chapter';

interface ScenarioStoreState extends FetchState<Scenario[]> {
	currentScenarioId: string | undefined;
}

type ScenarioDialogState =
	| { type: 'create' }
	| { type: 'update'; scenarioId: string }
	| { type: 'delete'; scenarioId: string }
	| { type: 'publish'; scenarioId: string }
	| undefined;

let instance: ReturnType<typeof createScenarioStore> | null = null;

function createScenarioStore() {
	const { supabase } = useServerPayload();

	const store = writable<ScenarioStoreState>({
		status: 'idle',
		data: undefined,
		error: undefined,
		currentScenarioId: undefined,
	});

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
				.select(
					`
					*,
					created_by:user_roles (*)
				`
				)
				.order('display_order', { ascending: true });

			if (error) throw error;

			const scenarios = data ?? [];

			store.update((state) => ({
				...state,
				status: 'success',
				data: scenarios,
				error: undefined,
			}));

			// currentScenarioId가 없으면 첫 번째 시나리오 자동 선택
			let currentState: ScenarioStoreState | undefined;
			store.subscribe((s) => (currentState = s))();

			if (!currentState?.currentScenarioId && scenarios.length > 0) {
				await init(scenarios[0].id);
			}
		} catch (error) {
			store.update((state) => ({
				...state,
				status: 'error',
				error: error instanceof Error ? error : new Error('Unknown error'),
			}));
		}
	}

	async function init(scenarioId: string) {
		store.update((state) => ({ ...state, currentScenarioId: scenarioId }));

		await Promise.all([
			useScenarioQuest().fetch(scenarioId),
			useScenarioChapter().fetch(scenarioId),
		]);
	}

	function reset() {
		store.update((state) => ({
			...state,
			currentScenarioId: undefined,
		}));
	}

	const admin = {
		async create(input: Omit<ScenarioInsert, 'display_order'>) {
			const { data, error } = await supabase
				.from('scenarios')
				.insert(input)
				.select('*, created_by:user_roles (*)')
				.single();

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						draft.data.push(data);
					} else {
						draft.data = [data];
					}
				})
			);

			return data;
		},

		async update(scenarioId: string, input: ScenarioUpdate) {
			const { data, error } = await supabase
				.from('scenarios')
				.update(input)
				.eq('id', scenarioId)
				.select('*, created_by:user_roles (*)')
				.single();

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					const index = draft.data?.findIndex((s) => s.id === scenarioId);
					if (index !== undefined && index >= 0 && draft.data) {
						draft.data[index] = data;
					}
				})
			);

			return data;
		},

		async remove(scenarioId: string) {
			const { error } = await supabase.from('scenarios').delete().eq('id', scenarioId);

			if (error) throw error;

			store.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						draft.data = draft.data.filter((s) => s.id !== scenarioId);
					}
					// 삭제된 시나리오가 현재 선택된 시나리오인 경우 초기화
					if (draft.currentScenarioId === scenarioId) {
						draft.currentScenarioId = draft.data?.[0]?.id;
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
					const scenario = draft.data?.find((s) => s.id === scenarioId);
					if (scenario) {
						scenario.status = 'published';
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
					const scenario = draft.data?.find((s) => s.id === scenarioId);
					if (scenario) {
						scenario.status = 'draft';
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
		reset,
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

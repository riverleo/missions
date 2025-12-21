import { writable, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	Need,
	NeedInsert,
	NeedUpdate,
	NeedFulfillment,
	NeedFulfillmentInsert,
	NeedFulfillmentUpdate,
	CharacterNeed,
	CharacterNeedInsert,
	CharacterNeedUpdate,
} from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';

type NeedDialogState =
	| { type: 'create' }
	| { type: 'update'; needId: string }
	| { type: 'delete'; needId: string }
	| undefined;

let instance: ReturnType<typeof createNeedStore> | null = null;

function createNeedStore() {
	const { supabase } = useServerPayload();

	const needStore = writable<RecordFetchState<Need>>({
		status: 'idle',
		data: {},
	});

	const needFulfillmentStore = writable<RecordFetchState<NeedFulfillment>>({
		status: 'idle',
		data: {},
	});

	const characterNeedStore = writable<RecordFetchState<CharacterNeed>>({
		status: 'idle',
		data: {},
	});

	const dialogStore = writable<NeedDialogState>(undefined);

	let currentScenarioId: string | undefined;

	async function fetch(scenarioId: string) {
		currentScenarioId = scenarioId;

		needStore.update((state) => ({ ...state, status: 'loading' }));
		needFulfillmentStore.update((state) => ({ ...state, status: 'loading' }));
		characterNeedStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			const [needsResult, fulfillmentsResult, characterNeedsResult] = await Promise.all([
				supabase.from('needs').select('*').eq('scenario_id', scenarioId).order('name'),
				supabase.from('need_fulfillments').select('*').eq('scenario_id', scenarioId),
				supabase.from('character_needs').select('*').eq('scenario_id', scenarioId),
			]);

			if (needsResult.error) throw needsResult.error;
			if (fulfillmentsResult.error) throw fulfillmentsResult.error;
			if (characterNeedsResult.error) throw characterNeedsResult.error;

			const needRecord: Record<string, Need> = {};
			for (const item of needsResult.data ?? []) {
				needRecord[item.id] = item;
			}

			const fulfillmentRecord: Record<string, NeedFulfillment> = {};
			for (const item of fulfillmentsResult.data ?? []) {
				fulfillmentRecord[item.id] = item;
			}

			const characterNeedRecord: Record<string, CharacterNeed> = {};
			for (const item of characterNeedsResult.data ?? []) {
				characterNeedRecord[item.id] = item;
			}

			needStore.set({ status: 'success', data: needRecord });
			needFulfillmentStore.set({ status: 'success', data: fulfillmentRecord });
			characterNeedStore.set({ status: 'success', data: characterNeedRecord });
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			needStore.set({ status: 'error', data: {}, error: err });
			needFulfillmentStore.set({ status: 'error', data: {}, error: err });
			characterNeedStore.set({ status: 'error', data: {}, error: err });
		}
	}

	function openDialog(state: NonNullable<NeedDialogState>) {
		dialogStore.set(state);
	}

	function closeDialog() {
		dialogStore.set(undefined);
	}

	const admin = {
		// Need CRUD
		async createNeed(need: Omit<NeedInsert, 'scenario_id'>) {
			if (!currentScenarioId) {
				throw new Error('useNeed: currentScenarioId is not set.');
			}

			const { data, error } = await supabase
				.from('needs')
				.insert({ ...need, scenario_id: currentScenarioId })
				.select()
				.single();

			if (error) throw error;

			needStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id] = data;
				})
			);

			return data;
		},

		async updateNeed(id: string, need: NeedUpdate) {
			const { error } = await supabase.from('needs').update(need).eq('id', id);

			if (error) throw error;

			needStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data[id]) {
						Object.assign(draft.data[id], need);
					}
				})
			);
		},

		async removeNeed(id: string) {
			const { error } = await supabase.from('needs').delete().eq('id', id);

			if (error) throw error;

			needStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
				})
			);
		},

		// NeedFulfillment CRUD
		async createNeedFulfillment(fulfillment: Omit<NeedFulfillmentInsert, 'scenario_id'>) {
			if (!currentScenarioId) {
				throw new Error('useNeed: currentScenarioId is not set.');
			}

			const { data, error } = await supabase
				.from('need_fulfillments')
				.insert({ ...fulfillment, scenario_id: currentScenarioId })
				.select()
				.single();

			if (error) throw error;

			needFulfillmentStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id] = data;
				})
			);

			return data;
		},

		async updateNeedFulfillment(id: string, fulfillment: NeedFulfillmentUpdate) {
			const { error } = await supabase.from('need_fulfillments').update(fulfillment).eq('id', id);

			if (error) throw error;

			needFulfillmentStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data[id]) {
						Object.assign(draft.data[id], fulfillment);
					}
				})
			);
		},

		async removeNeedFulfillment(id: string) {
			const { error } = await supabase.from('need_fulfillments').delete().eq('id', id);

			if (error) throw error;

			needFulfillmentStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
				})
			);
		},

		// CharacterNeed CRUD
		async createCharacterNeed(characterNeed: Omit<CharacterNeedInsert, 'scenario_id'>) {
			if (!currentScenarioId) {
				throw new Error('useNeed: currentScenarioId is not set.');
			}

			const { data, error } = await supabase
				.from('character_needs')
				.insert({ ...characterNeed, scenario_id: currentScenarioId })
				.select()
				.single();

			if (error) throw error;

			characterNeedStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id] = data;
				})
			);

			return data;
		},

		async updateCharacterNeed(id: string, characterNeed: CharacterNeedUpdate) {
			const { error } = await supabase.from('character_needs').update(characterNeed).eq('id', id);

			if (error) throw error;

			characterNeedStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data[id]) {
						Object.assign(draft.data[id], characterNeed);
					}
				})
			);
		},

		async removeCharacterNeed(id: string) {
			const { error } = await supabase.from('character_needs').delete().eq('id', id);

			if (error) throw error;

			characterNeedStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
				})
			);
		},
	};

	return {
		needStore: needStore as Readable<RecordFetchState<Need>>,
		needFulfillmentStore: needFulfillmentStore as Readable<RecordFetchState<NeedFulfillment>>,
		characterNeedStore: characterNeedStore as Readable<RecordFetchState<CharacterNeed>>,
		dialogStore: dialogStore as Readable<NeedDialogState>,
		fetch,
		openDialog,
		closeDialog,
		admin,
	};
}

export function useNeed() {
	if (!instance) {
		instance = createNeedStore();
	}
	return instance;
}

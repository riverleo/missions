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
	NeedId,
	NeedFulfillmentId,
	CharacterNeedId,
	ScenarioId,
} from '$lib/types';
import { useApp } from './use-app.svelte';

type NeedDialogState =
	| { type: 'create' }
	| { type: 'update'; needId: NeedId }
	| { type: 'delete'; needId: NeedId }
	| undefined;

let instance: ReturnType<typeof createNeedStore> | null = null;

function createNeedStore() {
	const { supabase } = useApp();

	const needStore = writable<RecordFetchState<NeedId, Need>>({
		status: 'idle',
		data: {},
	});

	const needFulfillmentStore = writable<RecordFetchState<NeedFulfillmentId, NeedFulfillment>>({
		status: 'idle',
		data: {},
	});

	const characterNeedStore = writable<RecordFetchState<CharacterNeedId, CharacterNeed>>({
		status: 'idle',
		data: {},
	});

	const needDialogStore = writable<NeedDialogState>(undefined);

	let initialized = false;

	function init() {
		initialized = true;
	}

	async function fetch() {
		if (!initialized) {
			throw new Error('useNeed not initialized. Call init() first.');
		}

		needStore.update((state) => ({ ...state, status: 'loading' }));
		needFulfillmentStore.update((state) => ({ ...state, status: 'loading' }));
		characterNeedStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			const [needsResult, fulfillmentsResult, characterNeedsResult] = await Promise.all([
				supabase.from('needs').select('*').order('name'),
				supabase.from('need_fulfillments').select('*'),
				supabase.from('character_needs').select('*'),
			]);

			if (needsResult.error) throw needsResult.error;
			if (fulfillmentsResult.error) throw fulfillmentsResult.error;
			if (characterNeedsResult.error) throw characterNeedsResult.error;

			const needRecord: Record<NeedId, Need> = {};
			for (const item of needsResult.data ?? []) {
				needRecord[item.id as NeedId] = item as Need;
			}

			const fulfillmentRecord: Record<NeedFulfillmentId, NeedFulfillment> = {};
			for (const item of fulfillmentsResult.data ?? []) {
				fulfillmentRecord[item.id as NeedFulfillmentId] = item as NeedFulfillment;
			}

			const characterNeedRecord: Record<CharacterNeedId, CharacterNeed> = {};
			for (const item of characterNeedsResult.data ?? []) {
				characterNeedRecord[item.id as CharacterNeedId] = item as CharacterNeed;
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

	function openNeedDialog(state: NonNullable<NeedDialogState>) {
		needDialogStore.set(state);
	}

	function closeNeedDialog() {
		needDialogStore.set(undefined);
	}

	const admin = {
		// Need CRUD
		async createNeed(scenarioId: ScenarioId, need: Omit<NeedInsert, 'scenario_id'>) {
			const { data, error } = await supabase
				.from('needs')
				.insert({ ...need, scenario_id: scenarioId })
				.select()
				.single<Need>();

			if (error) throw error;

			needStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as NeedId] = data;
				})
			);

			return data;
		},

		async updateNeed(id: NeedId, need: NeedUpdate) {
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

		async removeNeed(id: NeedId) {
			const { error } = await supabase.from('needs').delete().eq('id', id);

			if (error) throw error;

			needStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
				})
			);
		},

		// NeedFulfillment CRUD
		async createNeedFulfillment(scenarioId: ScenarioId, fulfillment: Omit<NeedFulfillmentInsert, 'scenario_id'>) {
			const { data, error } = await supabase
				.from('need_fulfillments')
				.insert({ ...fulfillment, scenario_id: scenarioId })
				.select()
				.single<NeedFulfillment>();

			if (error) throw error;

			needFulfillmentStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as NeedFulfillmentId] = data;
				})
			);

			return data;
		},

		async updateNeedFulfillment(id: NeedFulfillmentId, fulfillment: NeedFulfillmentUpdate) {
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

		async removeNeedFulfillment(id: NeedFulfillmentId) {
			const { error } = await supabase.from('need_fulfillments').delete().eq('id', id);

			if (error) throw error;

			needFulfillmentStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
				})
			);
		},

		// CharacterNeed CRUD
		async createCharacterNeed(scenarioId: ScenarioId, characterNeed: Omit<CharacterNeedInsert, 'scenario_id'>) {
			const { data, error } = await supabase
				.from('character_needs')
				.insert({ ...characterNeed, scenario_id: scenarioId })
				.select()
				.single<CharacterNeed>();

			if (error) throw error;

			characterNeedStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as CharacterNeedId] = data;
				})
			);

			return data;
		},

		async updateCharacterNeed(id: CharacterNeedId, characterNeed: CharacterNeedUpdate) {
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

		async removeCharacterNeed(id: CharacterNeedId) {
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
		needStore: needStore as Readable<RecordFetchState<NeedId, Need>>,
		needFulfillmentStore: needFulfillmentStore as Readable<
			RecordFetchState<NeedFulfillmentId, NeedFulfillment>
		>,
		characterNeedStore: characterNeedStore as Readable<
			RecordFetchState<CharacterNeedId, CharacterNeed>
		>,
		needDialogStore: needDialogStore as Readable<NeedDialogState>,
		init,
		fetch,
		openNeedDialog,
		closeNeedDialog,
		admin,
	};
}

export function useNeed() {
	if (!instance) {
		instance = createNeedStore();
	}
	return instance;
}

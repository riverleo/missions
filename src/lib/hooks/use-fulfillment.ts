import { writable, derived, get, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	NeedFulfillment,
	NeedFulfillmentInsert,
	NeedFulfillmentUpdate,
	ConditionFulfillment,
	ConditionFulfillmentInsert,
	ConditionFulfillmentUpdate,
	NeedFulfillmentId,
	ConditionFulfillmentId,
	NeedId,
	ConditionId,
	ScenarioId,
	Fulfillment,
	BehaviorAction,
} from '$lib/types';
import { useApp } from './use-app.svelte';
import { FulfillmentIdUtils } from '$lib/utils/fulfillment-id';

export type FulfillmentType = 'need' | 'condition';

let instance: ReturnType<typeof createFulfillmentStore> | null = null;

function createFulfillmentStore() {
	const { supabase } = useApp();

	const needFulfillmentStore = writable<RecordFetchState<NeedFulfillmentId, NeedFulfillment>>({
		status: 'idle',
		data: {},
	});

	const conditionFulfillmentStore = writable<
		RecordFetchState<ConditionFulfillmentId, ConditionFulfillment>
	>({
		status: 'idle',
		data: {},
	});

	// Derived stores
	const allNeedFulfillmentsStore = derived(needFulfillmentStore, ($store) =>
		Object.values($store.data)
	);

	const allConditionFulfillmentsStore = derived(conditionFulfillmentStore, ($store) =>
		Object.values($store.data)
	);

	const allFulfillmentsStore = derived(
		[needFulfillmentStore, conditionFulfillmentStore],
		([$need, $condition]) => [
			...Object.values($need.data).map(FulfillmentIdUtils.to),
			...Object.values($condition.data).map(FulfillmentIdUtils.to),
		]
	);

	let initialized = false;

	function init() {
		initialized = true;
	}

	async function fetch() {
		if (!initialized) {
			throw new Error('useFulfillment not initialized. Call init() first.');
		}

		needFulfillmentStore.update((state) => ({ ...state, status: 'loading' }));
		conditionFulfillmentStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			const [needFulfillmentsResult, conditionFulfillmentsResult] = await Promise.all([
				supabase.from('need_fulfillments').select('*'),
				supabase.from('condition_fulfillments').select('*'),
			]);

			if (needFulfillmentsResult.error) throw needFulfillmentsResult.error;
			if (conditionFulfillmentsResult.error) throw conditionFulfillmentsResult.error;

			// Need fulfillments
			const needFulfillmentRecord: Record<NeedFulfillmentId, NeedFulfillment> = {};
			for (const item of needFulfillmentsResult.data ?? []) {
				needFulfillmentRecord[item.id as NeedFulfillmentId] = item as NeedFulfillment;
			}

			// Condition fulfillments
			const conditionFulfillmentRecord: Record<ConditionFulfillmentId, ConditionFulfillment> = {};
			for (const item of conditionFulfillmentsResult.data ?? []) {
				conditionFulfillmentRecord[item.id as ConditionFulfillmentId] =
					item as ConditionFulfillment;
			}

			needFulfillmentStore.set({ status: 'success', data: needFulfillmentRecord });
			conditionFulfillmentStore.set({ status: 'success', data: conditionFulfillmentRecord });
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			needFulfillmentStore.set({ status: 'error', data: {}, error: err });
			conditionFulfillmentStore.set({ status: 'error', data: {}, error: err });
		}
	}

	// Getter functions
	function getOrUndefinedNeedFulfillment(
		id: string | null | undefined
	): NeedFulfillment | undefined {
		if (!id) return undefined;
		return get(needFulfillmentStore).data[id as NeedFulfillmentId];
	}

	function getOrUndefinedConditionFulfillment(
		id: string | null | undefined
	): ConditionFulfillment | undefined {
		if (!id) return undefined;
		return get(conditionFulfillmentStore).data[id as ConditionFulfillmentId];
	}

	// GetAll functions
	function getAllNeedFulfillments(): NeedFulfillment[] {
		return get(allNeedFulfillmentsStore);
	}

	function getAllConditionFulfillments(): ConditionFulfillment[] {
		return get(allConditionFulfillmentsStore);
	}

	// Get fulfillment by type and id
	function getOrUndefinedFulfillment(type: FulfillmentType, id: string): Fulfillment | undefined {
		return getAllFulfillments().find((f) => {
			if (type === 'need') {
				return f.fulfillmentType === 'need' && f.id === id;
			} else {
				return f.fulfillmentType === 'condition' && f.id === id;
			}
		});
	}

	function getFulfillment(type: FulfillmentType, id: string): Fulfillment {
		const fulfillment = getOrUndefinedFulfillment(type, id);
		if (!fulfillment) {
			throw new Error(`${type === 'need' ? 'Need' : 'Condition'} fulfillment not found: ${id}`);
		}
		return fulfillment;
	}

	// Get all fulfillments (need + condition)
	function getAllFulfillments(): Fulfillment[] {
		return get(allFulfillmentsStore);
	}

	// Get fulfillments by behavior action
	function getAllFulfillmentsByBehaviorAction(behaviorAction: BehaviorAction): Fulfillment[] {
		return getAllFulfillments().filter((f) => {
			if (behaviorAction.behaviorType === 'need') {
				return f.fulfillmentType === 'need' && f.need_id === behaviorAction.need_id;
			} else {
				return f.fulfillmentType === 'condition' && f.condition_id === behaviorAction.condition_id;
			}
		});
	}

	const admin = {
		// NeedFulfillment CRUD
		async createNeedFulfillment(
			scenarioId: ScenarioId,
			fulfillment: Omit<NeedFulfillmentInsert, 'scenario_id'>
		) {
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

		// ConditionFulfillment CRUD
		async createConditionFulfillment(
			scenarioId: ScenarioId,
			fulfillment: Omit<ConditionFulfillmentInsert, 'scenario_id'>
		) {
			const { data, error } = await supabase
				.from('condition_fulfillments')
				.insert({ ...fulfillment, scenario_id: scenarioId })
				.select()
				.single<ConditionFulfillment>();

			if (error) throw error;

			conditionFulfillmentStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as ConditionFulfillmentId] = data;
				})
			);

			return data;
		},

		async updateConditionFulfillment(
			id: ConditionFulfillmentId,
			fulfillment: ConditionFulfillmentUpdate
		) {
			const { error } = await supabase
				.from('condition_fulfillments')
				.update(fulfillment)
				.eq('id', id);

			if (error) throw error;

			conditionFulfillmentStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data[id]) {
						Object.assign(draft.data[id], fulfillment);
					}
				})
			);
		},

		async removeConditionFulfillment(id: ConditionFulfillmentId) {
			const { error } = await supabase.from('condition_fulfillments').delete().eq('id', id);

			if (error) throw error;

			conditionFulfillmentStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
				})
			);
		},
	};

	return {
		needFulfillmentStore: needFulfillmentStore as Readable<
			RecordFetchState<NeedFulfillmentId, NeedFulfillment>
		>,
		conditionFulfillmentStore: conditionFulfillmentStore as Readable<
			RecordFetchState<ConditionFulfillmentId, ConditionFulfillment>
		>,
		allNeedFulfillmentsStore,
		allConditionFulfillmentsStore,
		allFulfillmentsStore,
		init,
		fetch,
		getOrUndefinedNeedFulfillment,
		getOrUndefinedConditionFulfillment,
		getAllNeedFulfillments,
		getAllConditionFulfillments,
		getOrUndefinedFulfillment,
		getFulfillment,
		getAllFulfillments,
		getAllFulfillmentsByBehaviorAction,
		admin,
	};
}

export function useFulfillment() {
	if (!instance) {
		instance = createFulfillmentStore();
	}
	return instance;
}

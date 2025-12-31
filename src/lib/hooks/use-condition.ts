import { writable, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	Condition,
	ConditionInsert,
	ConditionUpdate,
	ConditionFulfillment,
	ConditionFulfillmentInsert,
	ConditionFulfillmentUpdate,
	BuildingCondition,
	BuildingConditionInsert,
	BuildingConditionUpdate,
	ConditionEffect,
	ConditionEffectInsert,
	ConditionEffectUpdate,
	ConditionId,
	ConditionFulfillmentId,
	BuildingConditionId,
	ConditionEffectId,
	ScenarioId,
} from '$lib/types';
import { useServerPayload } from './use-server-payload.svelte';

type ConditionDialogState =
	| { type: 'create' }
	| { type: 'update'; conditionId: ConditionId }
	| { type: 'delete'; conditionId: ConditionId }
	| undefined;

let instance: ReturnType<typeof createConditionStore> | null = null;

function createConditionStore() {
	const { supabase } = useServerPayload();

	const conditionStore = writable<RecordFetchState<ConditionId, Condition>>({
		status: 'idle',
		data: {},
	});

	const conditionFulfillmentStore = writable<
		RecordFetchState<ConditionFulfillmentId, ConditionFulfillment>
	>({
		status: 'idle',
		data: {},
	});

	const buildingConditionStore = writable<RecordFetchState<BuildingConditionId, BuildingCondition>>(
		{
			status: 'idle',
			data: {},
		}
	);

	const conditionEffectStore = writable<RecordFetchState<ConditionEffectId, ConditionEffect>>({
		status: 'idle',
		data: {},
	});

	const dialogStore = writable<ConditionDialogState>(undefined);

	let initialized = false;
	let currentScenarioId: ScenarioId | undefined;

	function init() {
		initialized = true;
	}

	async function fetch(scenarioId: ScenarioId) {
		if (!initialized) {
			throw new Error('useCondition not initialized. Call init() first.');
		}
		currentScenarioId = scenarioId;

		conditionStore.update((state) => ({ ...state, status: 'loading' }));
		conditionFulfillmentStore.update((state) => ({ ...state, status: 'loading' }));
		buildingConditionStore.update((state) => ({ ...state, status: 'loading' }));
		conditionEffectStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			const [conditionsResult, fulfillmentsResult, buildingConditionsResult, effectsResult] =
				await Promise.all([
					supabase.from('conditions').select('*').eq('scenario_id', scenarioId).order('name'),
					supabase.from('condition_fulfillments').select('*').eq('scenario_id', scenarioId),
					supabase.from('building_conditions').select('*').eq('scenario_id', scenarioId),
					supabase.from('condition_effects').select('*').eq('scenario_id', scenarioId),
				]);

			if (conditionsResult.error) throw conditionsResult.error;
			if (fulfillmentsResult.error) throw fulfillmentsResult.error;
			if (buildingConditionsResult.error) throw buildingConditionsResult.error;
			if (effectsResult.error) throw effectsResult.error;

			const conditionRecord: Record<ConditionId, Condition> = {};
			for (const item of conditionsResult.data ?? []) {
				conditionRecord[item.id as ConditionId] = item as Condition;
			}

			const fulfillmentRecord: Record<ConditionFulfillmentId, ConditionFulfillment> = {};
			for (const item of fulfillmentsResult.data ?? []) {
				fulfillmentRecord[item.id as ConditionFulfillmentId] = item as ConditionFulfillment;
			}

			const buildingConditionRecord: Record<BuildingConditionId, BuildingCondition> = {};
			for (const item of buildingConditionsResult.data ?? []) {
				buildingConditionRecord[item.id as BuildingConditionId] = item as BuildingCondition;
			}

			const effectRecord: Record<ConditionEffectId, ConditionEffect> = {};
			for (const item of effectsResult.data ?? []) {
				effectRecord[item.id as ConditionEffectId] = item as ConditionEffect;
			}

			conditionStore.set({ status: 'success', data: conditionRecord });
			conditionFulfillmentStore.set({ status: 'success', data: fulfillmentRecord });
			buildingConditionStore.set({ status: 'success', data: buildingConditionRecord });
			conditionEffectStore.set({ status: 'success', data: effectRecord });
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			conditionStore.set({ status: 'error', data: {}, error: err });
			conditionFulfillmentStore.set({ status: 'error', data: {}, error: err });
			buildingConditionStore.set({ status: 'error', data: {}, error: err });
			conditionEffectStore.set({ status: 'error', data: {}, error: err });
		}
	}

	function openDialog(state: NonNullable<ConditionDialogState>) {
		dialogStore.set(state);
	}

	function closeDialog() {
		dialogStore.set(undefined);
	}

	const admin = {
		// Condition CRUD
		async createCondition(condition: Omit<ConditionInsert, 'scenario_id'>) {
			if (!currentScenarioId) {
				throw new Error('useCondition: currentScenarioId is not set.');
			}

			const { data, error } = await supabase
				.from('conditions')
				.insert({ ...condition, scenario_id: currentScenarioId })
				.select()
				.single<Condition>();

			if (error) throw error;

			conditionStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as ConditionId] = data;
				})
			);

			return data;
		},

		async updateCondition(id: ConditionId, condition: ConditionUpdate) {
			const { error } = await supabase.from('conditions').update(condition).eq('id', id);

			if (error) throw error;

			conditionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data[id]) {
						Object.assign(draft.data[id], condition);
					}
				})
			);
		},

		async removeCondition(id: ConditionId) {
			const { error } = await supabase.from('conditions').delete().eq('id', id);

			if (error) throw error;

			conditionStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
				})
			);
		},

		// ConditionFulfillment CRUD
		async createConditionFulfillment(fulfillment: Omit<ConditionFulfillmentInsert, 'scenario_id'>) {
			if (!currentScenarioId) {
				throw new Error('useCondition: currentScenarioId is not set.');
			}

			const { data, error } = await supabase
				.from('condition_fulfillments')
				.insert({ ...fulfillment, scenario_id: currentScenarioId })
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

		// BuildingCondition CRUD
		async createBuildingCondition(buildingCondition: Omit<BuildingConditionInsert, 'scenario_id'>) {
			if (!currentScenarioId) {
				throw new Error('useCondition: currentScenarioId is not set.');
			}

			const { data, error } = await supabase
				.from('building_conditions')
				.insert({ ...buildingCondition, scenario_id: currentScenarioId })
				.select()
				.single<BuildingCondition>();

			if (error) throw error;

			buildingConditionStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as BuildingConditionId] = data;
				})
			);

			return data;
		},

		async updateBuildingCondition(
			id: BuildingConditionId,
			buildingCondition: BuildingConditionUpdate
		) {
			const { error } = await supabase
				.from('building_conditions')
				.update(buildingCondition)
				.eq('id', id);

			if (error) throw error;

			buildingConditionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data[id]) {
						Object.assign(draft.data[id], buildingCondition);
					}
				})
			);
		},

		async removeBuildingCondition(id: BuildingConditionId) {
			const { error } = await supabase.from('building_conditions').delete().eq('id', id);

			if (error) throw error;

			buildingConditionStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
				})
			);
		},

		// ConditionEffect CRUD
		async createConditionEffect(
			effect: Omit<ConditionEffectInsert, 'scenario_id' | 'condition_id'> & {
				condition_id: ConditionId;
			}
		) {
			if (!currentScenarioId) {
				throw new Error('useCondition: currentScenarioId is not set.');
			}

			const { data, error } = await supabase
				.from('condition_effects')
				.insert({
					...effect,
					scenario_id: currentScenarioId,
				})
				.select()
				.single<ConditionEffect>();

			if (error) throw error;

			conditionEffectStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as ConditionEffectId] = data;
				})
			);

			return data;
		},

		async updateConditionEffect(id: ConditionEffectId, effect: ConditionEffectUpdate) {
			const { error } = await supabase.from('condition_effects').update(effect).eq('id', id);

			if (error) throw error;

			conditionEffectStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data[id]) {
						Object.assign(draft.data[id], effect);
					}
				})
			);
		},

		async removeConditionEffect(id: ConditionEffectId) {
			const { error } = await supabase.from('condition_effects').delete().eq('id', id);

			if (error) throw error;

			conditionEffectStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
				})
			);
		},
	};

	return {
		conditionStore: conditionStore as Readable<RecordFetchState<ConditionId, Condition>>,
		conditionFulfillmentStore: conditionFulfillmentStore as Readable<
			RecordFetchState<ConditionFulfillmentId, ConditionFulfillment>
		>,
		buildingConditionStore: buildingConditionStore as Readable<
			RecordFetchState<BuildingConditionId, BuildingCondition>
		>,
		conditionEffectStore: conditionEffectStore as Readable<
			RecordFetchState<ConditionEffectId, ConditionEffect>
		>,
		dialogStore: dialogStore as Readable<ConditionDialogState>,
		init,
		fetch,
		openDialog,
		closeDialog,
		admin,
	};
}

export function useCondition() {
	if (!instance) {
		instance = createConditionStore();
	}
	return instance;
}

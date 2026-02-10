import { writable, derived, get, type Readable } from 'svelte/store';
import { produce } from 'immer';
import type {
	RecordFetchState,
	Building,
	BuildingInsert,
	BuildingUpdate,
	BuildingItem,
	BuildingItemInsert,
	BuildingItemUpdate,
	BuildingState,
	BuildingStateInsert,
	BuildingStateUpdate,
	BuildingInteractionActionUpdate,
	Condition,
	ConditionInsert,
	ConditionUpdate,
	ConditionFulfillment,
	BuildingCondition,
	BuildingConditionInsert,
	BuildingConditionUpdate,
	ConditionEffect,
	ConditionEffectInsert,
	ConditionEffectUpdate,
	BuildingId,
	BuildingItemId,
	BuildingStateId,
	BuildingInteractionId,
	BuildingInteractionActionId,
	ConditionId,
	ConditionFulfillmentId,
	BuildingConditionId,
	ConditionEffectId,
	ScenarioId,
	WorldBuildingId,
} from '$lib/types';
import { useApp } from './use-app.svelte';
import { useFulfillment } from './use-fulfillment';
import { useInteraction } from './use-interaction';
import { useWorld } from './use-world';

type BuildingDialogState =
	| { type: 'create' }
	| { type: 'update'; buildingId: BuildingId }
	| { type: 'delete'; buildingId: BuildingId }
	| undefined;

type ConditionDialogState =
	| { type: 'create' }
	| { type: 'update'; conditionId: ConditionId }
	| { type: 'delete'; conditionId: ConditionId }
	| undefined;

let instance: ReturnType<typeof createBuildingStore> | null = null;

function createBuildingStore() {
	const { supabase } = useApp();
	const interaction = useInteraction();

	const buildingStore = writable<RecordFetchState<BuildingId, Building>>({
		status: 'idle',
		data: {},
	});

	const buildingItemStore = writable<RecordFetchState<BuildingItemId, BuildingItem>>({
		status: 'idle',
		data: {},
	});

	// building_id를 키로, 해당 빌딩의 states 배열을 값으로
	const buildingStateStore = writable<RecordFetchState<BuildingId, BuildingState[]>>({
		status: 'idle',
		data: {},
	});

	const buildingDialogStore = writable<BuildingDialogState>(undefined);

	const conditionStore = writable<RecordFetchState<ConditionId, Condition>>({
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

	const conditionDialogStore = writable<ConditionDialogState>(undefined);

	// Derived stores for computed values
	const allBuildingsStore = derived(buildingStore, ($store) => Object.values($store.data));

	const allBuildingItemsStore = derived(buildingItemStore, ($store) => Object.values($store.data));

	const allBuildingStatesStore = derived(buildingStateStore, ($store) => $store.data);

	const allConditionsStore = derived(conditionStore, ($store) => Object.values($store.data));

	const allBuildingConditionsStore = derived(buildingConditionStore, ($store) =>
		Object.values($store.data)
	);

	const allConditionEffectsStore = derived(conditionEffectStore, ($store) =>
		Object.values($store.data)
	);

	const uiStore = writable({
		showBodyPreview: false,
	});

	let initialized = false;

	function init() {
		initialized = true;
	}

	async function fetch() {
		if (!initialized) {
			throw new Error('useBuilding not initialized. Call init() first.');
		}

		buildingStore.update((state) => ({ ...state, status: 'loading' }));
		buildingItemStore.update((state) => ({ ...state, status: 'loading' }));
		conditionStore.update((state) => ({ ...state, status: 'loading' }));
		buildingConditionStore.update((state) => ({ ...state, status: 'loading' }));
		conditionEffectStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			const [
				buildingsResult,
				buildingItemsResult,
				conditionsResult,
				buildingConditionsResult,
				effectsResult,
			] = await Promise.all([
				supabase.from('buildings').select('*, building_states(*)').order('name'),
				supabase.from('building_items').select('*'),
				supabase.from('conditions').select('*').order('name'),
				supabase.from('building_conditions').select('*'),
				supabase.from('condition_effects').select('*'),
			]);

			if (buildingsResult.error) throw buildingsResult.error;
			if (buildingItemsResult.error) throw buildingItemsResult.error;
			if (conditionsResult.error) throw conditionsResult.error;
			if (buildingConditionsResult.error) throw buildingConditionsResult.error;
			if (effectsResult.error) throw effectsResult.error;

			// Buildings and states
			const buildingRecord: Record<BuildingId, Building> = {};
			const stateRecord: Record<BuildingId, BuildingState[]> = {};

			for (const item of buildingsResult.data ?? []) {
				const { building_states, ...building } = item;
				buildingRecord[item.id as BuildingId] = building as Building;
				stateRecord[item.id as BuildingId] = (building_states ?? []) as BuildingState[];
			}

			// Building items
			const buildingItemRecord: Record<BuildingItemId, BuildingItem> = {};
			for (const item of buildingItemsResult.data ?? []) {
				buildingItemRecord[item.id as BuildingItemId] = item as BuildingItem;
			}

			// Conditions
			const conditionRecord: Record<ConditionId, Condition> = {};
			for (const item of conditionsResult.data ?? []) {
				conditionRecord[item.id as ConditionId] = item as Condition;
			}

			// Building conditions
			const buildingConditionRecord: Record<BuildingConditionId, BuildingCondition> = {};
			for (const item of buildingConditionsResult.data ?? []) {
				buildingConditionRecord[item.id as BuildingConditionId] = item as BuildingCondition;
			}

			// Condition effects
			const effectRecord: Record<ConditionEffectId, ConditionEffect> = {};
			for (const item of effectsResult.data ?? []) {
				effectRecord[item.id as ConditionEffectId] = item as ConditionEffect;
			}

			buildingStore.set({ status: 'success', data: buildingRecord, error: undefined });
			buildingItemStore.set({ status: 'success', data: buildingItemRecord, error: undefined });
			buildingStateStore.set({ status: 'success', data: stateRecord, error: undefined });
			conditionStore.set({ status: 'success', data: conditionRecord });
			buildingConditionStore.set({ status: 'success', data: buildingConditionRecord });
			conditionEffectStore.set({ status: 'success', data: effectRecord });
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			buildingStore.set({ status: 'error', data: {}, error: err });
			buildingItemStore.set({ status: 'error', data: {}, error: err });
			buildingStateStore.set({ status: 'error', data: {}, error: err });
			conditionStore.set({ status: 'error', data: {}, error: err });
			buildingConditionStore.set({ status: 'error', data: {}, error: err });
			conditionEffectStore.set({ status: 'error', data: {}, error: err });
		}
	}

	function openBuildingDialog(state: NonNullable<BuildingDialogState>) {
		buildingDialogStore.set(state);
	}

	function closeBuildingDialog() {
		buildingDialogStore.set(undefined);
	}

	function openConditionDialog(state: NonNullable<ConditionDialogState>) {
		conditionDialogStore.set(state);
	}

	function closeConditionDialog() {
		conditionDialogStore.set(undefined);
	}

	// Getter functions - throw if not found (required data)
	function getBuilding(id: string): Building {
		const data = getOrUndefinedBuilding(id);
		if (!data) throw new Error(`Building not found: ${id}`);
		return data;
	}

	function getCondition(id: string): Condition {
		const data = get(conditionStore).data[id as ConditionId];
		if (!data) throw new Error(`Condition not found: ${id}`);
		return data;
	}

	function getBuildingCondition(id: string): BuildingCondition {
		const data = get(buildingConditionStore).data[id as BuildingConditionId];
		if (!data) throw new Error(`BuildingCondition not found: ${id}`);
		return data;
	}

	// Getter functions - return undefined if not found (optional data)
	function getOrUndefinedBuilding(id: string | null | undefined): Building | undefined {
		if (!id) return undefined;
		return get(buildingStore).data[id as BuildingId];
	}

	function getOrUndefinedBuildingItem(id: string | null | undefined): BuildingItem | undefined {
		if (!id) return undefined;
		return get(buildingItemStore).data[id as BuildingItemId];
	}

	function getOrUndefinedBuildingStates(buildingId: string | null | undefined): BuildingState[] | undefined {
		if (!buildingId) return undefined;
		return get(buildingStateStore).data[buildingId as BuildingId];
	}

	function getOrUndefinedCondition(id: string | null | undefined): Condition | undefined {
		if (!id) return undefined;
		return get(conditionStore).data[id as ConditionId];
	}


	function getOrUndefinedBuildingCondition(id: string | null | undefined): BuildingCondition | undefined {
		if (!id) return undefined;
		return get(buildingConditionStore).data[id as BuildingConditionId];
	}

	function getOrUndefinedConditionEffect(id: string | null | undefined): ConditionEffect | undefined {
		if (!id) return undefined;
		return get(conditionEffectStore).data[id as ConditionEffectId];
	}

	// GetAll functions
	function getAllBuildings(): Building[] {
		return get(allBuildingsStore);
	}

	function getAllBuildingItems(): BuildingItem[] {
		return get(allBuildingItemsStore);
	}

	function getAllBuildingStates(): Record<BuildingId, BuildingState[]> {
		return get(allBuildingStatesStore);
	}

	function getAllConditions(): Condition[] {
		return get(allConditionsStore);
	}


	function getAllBuildingConditions(): BuildingCondition[] {
		return get(allBuildingConditionsStore);
	}

	function getAllConditionEffects(): ConditionEffect[] {
		return get(allConditionEffectsStore);
	}

	const admin = {
		uiStore: uiStore as Readable<{ showBodyPreview: boolean }>,

		setShowBodyPreview(value: boolean) {
			uiStore.update((s) => ({ ...s, showBodyPreview: value }));
		},

		async createBuilding(scenarioId: ScenarioId, building: Omit<BuildingInsert, 'scenario_id'>) {
			const { data, error } = await supabase
				.from('buildings')
				.insert({
					...building,
					scenario_id: scenarioId,
				})
				.select('*')
				.single<Building>();

			if (error) throw error;

			buildingStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as BuildingId] = data;
				})
			);

			buildingStateStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as BuildingId] = [];
				})
			);

			return data;
		},

		async updateBuilding(id: BuildingId, building: BuildingUpdate) {
			const { error } = await supabase.from('buildings').update(building).eq('id', id);

			if (error) throw error;

			buildingStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], building);
					}
				})
			);
		},

		async removeBuilding(id: BuildingId) {
			const { error } = await supabase.from('buildings').delete().eq('id', id);

			if (error) throw error;

			buildingStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);

			buildingStateStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);
		},

		async createBuildingItem(
			scenarioId: ScenarioId,
			buildingItem: Omit<BuildingItemInsert, 'scenario_id'>
		) {
			const { data, error } = await supabase
				.from('building_items')
				.insert({
					...buildingItem,
					scenario_id: scenarioId,
				})
				.select('*')
				.single<BuildingItem>();

			if (error) throw error;

			buildingItemStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as BuildingItemId] = data;
				})
			);

			return data;
		},

		async updateBuildingItem(id: BuildingItemId, buildingItem: BuildingItemUpdate) {
			const { error } = await supabase.from('building_items').update(buildingItem).eq('id', id);

			if (error) throw error;

			buildingItemStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], buildingItem);
					}
				})
			);
		},

		async removeBuildingItem(id: BuildingItemId) {
			const { error } = await supabase.from('building_items').delete().eq('id', id);

			if (error) throw error;

			buildingItemStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);
		},

		async createBuildingState(
			buildingId: BuildingId,
			state: Omit<BuildingStateInsert, 'building_id'>
		) {
			const { data, error } = await supabase
				.from('building_states')
				.insert({
					...state,
					building_id: buildingId,
				})
				.select()
				.single<BuildingState>();

			if (error) throw error;

			buildingStateStore.update((s) =>
				produce(s, (draft) => {
					if (draft.data[buildingId]) {
						draft.data[buildingId].push(data);
					} else {
						draft.data[buildingId] = [data];
					}
				})
			);

			return data;
		},

		async updateBuildingState(
			stateId: BuildingStateId,
			buildingId: BuildingId,
			updates: BuildingStateUpdate
		) {
			const { error } = await supabase.from('building_states').update(updates).eq('id', stateId);

			if (error) throw error;

			buildingStateStore.update((s) =>
				produce(s, (draft) => {
					const states = draft.data[buildingId];
					if (states) {
						const state = states.find((bs) => bs.id === stateId);
						if (state) {
							Object.assign(state, updates);
						}
					}
				})
			);
		},

		async removeBuildingState(stateId: BuildingStateId, buildingId: BuildingId) {
			const { error } = await supabase.from('building_states').delete().eq('id', stateId);

			if (error) throw error;

			buildingStateStore.update((s) =>
				produce(s, (draft) => {
					const states = draft.data[buildingId];
					if (states) {
						draft.data[buildingId] = states.filter((bs) => bs.id !== stateId);
					}
				})
			);
		},

		// Building Interaction CRUD - delegated to useInteraction
		createBuildingInteraction: interaction.admin.createBuildingInteraction,
		updateBuildingInteraction: interaction.admin.updateBuildingInteraction,
		removeBuildingInteraction: interaction.admin.removeBuildingInteraction,
		createBuildingInteractionAction: interaction.admin.createBuildingInteractionAction,
		// Wrapper to maintain old signature (actionId, buildingInteractionId, updates) -> (actionId, updates)
		async updateBuildingInteractionAction(
			actionId: BuildingInteractionActionId,
			_buildingInteractionId: BuildingInteractionId, // ignored, kept for compatibility
			updates: BuildingInteractionActionUpdate
		) {
			return interaction.admin.updateBuildingInteractionAction(actionId, updates);
		},
		// Wrapper to maintain old signature (actionId, buildingInteractionId) -> (actionId)
		async removeBuildingInteractionAction(
			actionId: BuildingInteractionActionId,
			_buildingInteractionId: BuildingInteractionId // ignored, kept for compatibility
		) {
			return interaction.admin.removeBuildingInteractionAction(actionId);
		},

		// Condition CRUD
		async createCondition(scenarioId: ScenarioId, condition: Omit<ConditionInsert, 'scenario_id'>) {
			const { data, error } = await supabase
				.from('conditions')
				.insert({ ...condition, scenario_id: scenarioId })
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

		// ConditionFulfillment CRUD - delegated to useFulfillment
		createConditionFulfillment: useFulfillment().admin.createConditionFulfillment,
		updateConditionFulfillment: useFulfillment().admin.updateConditionFulfillment,
		removeConditionFulfillment: useFulfillment().admin.removeConditionFulfillment,

		// BuildingCondition CRUD
		async createBuildingCondition(
			scenarioId: ScenarioId,
			buildingCondition: Omit<BuildingConditionInsert, 'scenario_id'>
		) {
			const { data, error } = await supabase
				.from('building_conditions')
				.insert({ ...buildingCondition, scenario_id: scenarioId })
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
			scenarioId: ScenarioId,
			effect: Omit<ConditionEffectInsert, 'scenario_id' | 'condition_id'> & {
				condition_id: ConditionId;
			}
		) {
			const { data, error } = await supabase
				.from('condition_effects')
				.insert({
					...effect,
					scenario_id: scenarioId,
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
		buildingStore: buildingStore as Readable<RecordFetchState<BuildingId, Building>>,
		buildingItemStore: buildingItemStore as Readable<
			RecordFetchState<BuildingItemId, BuildingItem>
		>,
		buildingStateStore: buildingStateStore as Readable<
			RecordFetchState<BuildingId, BuildingState[]>
		>,
		buildingDialogStore: buildingDialogStore as Readable<BuildingDialogState>,
		conditionStore: conditionStore as Readable<RecordFetchState<ConditionId, Condition>>,
		buildingConditionStore: buildingConditionStore as Readable<
			RecordFetchState<BuildingConditionId, BuildingCondition>
		>,
		conditionEffectStore: conditionEffectStore as Readable<
			RecordFetchState<ConditionEffectId, ConditionEffect>
		>,
		conditionDialogStore: conditionDialogStore as Readable<ConditionDialogState>,
		allBuildingsStore,
		allBuildingItemsStore,
		allBuildingStatesStore,
		allConditionsStore,
		allBuildingConditionsStore,
		allConditionEffectsStore,
		init,
		fetch,
		openBuildingDialog,
		closeBuildingDialog,
		openConditionDialog,
		closeConditionDialog,
		getBuilding,
		getOrUndefinedBuilding,
		getOrUndefinedBuildingItem,
		getOrUndefinedBuildingStates,
		getCondition,
		getOrUndefinedCondition,
		getBuildingCondition,
		getOrUndefinedBuildingCondition,
		getOrUndefinedConditionEffect,
		getAllBuildings,
		getAllBuildingItems,
		getAllBuildingStates,
		getAllConditions,
		getAllBuildingConditions,
		getAllConditionEffects,
		admin,
	};
}

export function useBuilding() {
	if (!instance) {
		instance = createBuildingStore();
	}
	return instance;
}

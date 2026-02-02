import { writable, get, type Readable } from 'svelte/store';
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
	BuildingInteraction,
	BuildingInteractionInsert,
	BuildingInteractionUpdate,
	BuildingInteractionAction,
	BuildingInteractionActionInsert,
	BuildingInteractionActionUpdate,
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
} from '$lib/types';
import { useApp } from './use-app.svelte';

type BuildingDialogState =
	| { type: 'create' }
	| { type: 'update'; buildingId: BuildingId }
	| { type: 'delete'; buildingId: BuildingId }
	| undefined;

type BuildingInteractionDialogState =
	| { type: 'create' }
	| { type: 'update'; buildingInteractionId: BuildingInteractionId }
	| { type: 'delete'; buildingInteractionId: BuildingInteractionId }
	| undefined;

type ConditionDialogState =
	| { type: 'create' }
	| { type: 'update'; conditionId: ConditionId }
	| { type: 'delete'; conditionId: ConditionId }
	| undefined;

let instance: ReturnType<typeof createBuildingStore> | null = null;

function createBuildingStore() {
	const { supabase } = useApp();

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

	// building_interaction_id를 키로 관리
	const buildingInteractionStore = writable<
		RecordFetchState<BuildingInteractionId, BuildingInteraction>
	>({
		status: 'idle',
		data: {},
	});

	// building_interaction_id를 키로, 해당 interaction의 actions 배열을 값으로
	const buildingInteractionActionStore = writable<
		RecordFetchState<BuildingInteractionId, BuildingInteractionAction[]>
	>({
		status: 'idle',
		data: {},
	});

	const buildingDialogStore = writable<BuildingDialogState>(undefined);
	const buildingInteractionDialogStore = writable<BuildingInteractionDialogState>(undefined);

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

	const conditionDialogStore = writable<ConditionDialogState>(undefined);

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
		buildingInteractionStore.update((state) => ({ ...state, status: 'loading' }));
		conditionStore.update((state) => ({ ...state, status: 'loading' }));
		conditionFulfillmentStore.update((state) => ({ ...state, status: 'loading' }));
		buildingConditionStore.update((state) => ({ ...state, status: 'loading' }));
		conditionEffectStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			const [
				buildingsResult,
				buildingItemsResult,
				interactionsResult,
				conditionsResult,
				fulfillmentsResult,
				buildingConditionsResult,
				effectsResult,
			] = await Promise.all([
				supabase.from('buildings').select('*, building_states(*)').order('name'),
				supabase.from('building_items').select('*'),
				supabase
					.from('building_interactions')
					.select('*, building_interaction_actions(*)')
					.order('created_at'),
				supabase.from('conditions').select('*').order('name'),
				supabase.from('condition_fulfillments').select('*'),
				supabase.from('building_conditions').select('*'),
				supabase.from('condition_effects').select('*'),
			]);

			if (buildingsResult.error) throw buildingsResult.error;
			if (buildingItemsResult.error) throw buildingItemsResult.error;
			if (interactionsResult.error) throw interactionsResult.error;
			if (conditionsResult.error) throw conditionsResult.error;
			if (fulfillmentsResult.error) throw fulfillmentsResult.error;
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

			// Building interactions and actions
			const interactionRecord: Record<BuildingInteractionId, BuildingInteraction> = {};
			const actionRecord: Record<BuildingInteractionId, BuildingInteractionAction[]> = {};

			for (const item of interactionsResult.data ?? []) {
				const { building_interaction_actions, ...interaction } = item;
				interactionRecord[item.id as BuildingInteractionId] = interaction as BuildingInteraction;
				actionRecord[item.id as BuildingInteractionId] = (building_interaction_actions ??
					[]) as BuildingInteractionAction[];
			}

			// Conditions
			const conditionRecord: Record<ConditionId, Condition> = {};
			for (const item of conditionsResult.data ?? []) {
				conditionRecord[item.id as ConditionId] = item as Condition;
			}

			// Condition fulfillments
			const fulfillmentRecord: Record<ConditionFulfillmentId, ConditionFulfillment> = {};
			for (const item of fulfillmentsResult.data ?? []) {
				fulfillmentRecord[item.id as ConditionFulfillmentId] = item as ConditionFulfillment;
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
			buildingInteractionStore.set({
				status: 'success',
				data: interactionRecord,
				error: undefined,
			});
			buildingInteractionActionStore.set({
				status: 'success',
				data: actionRecord,
				error: undefined,
			});
			conditionStore.set({ status: 'success', data: conditionRecord });
			conditionFulfillmentStore.set({ status: 'success', data: fulfillmentRecord });
			buildingConditionStore.set({ status: 'success', data: buildingConditionRecord });
			conditionEffectStore.set({ status: 'success', data: effectRecord });
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			buildingStore.set({ status: 'error', data: {}, error: err });
			buildingItemStore.set({ status: 'error', data: {}, error: err });
			buildingStateStore.set({ status: 'error', data: {}, error: err });
			buildingInteractionStore.set({ status: 'error', data: {}, error: err });
			buildingInteractionActionStore.set({ status: 'error', data: {}, error: err });
			conditionStore.set({ status: 'error', data: {}, error: err });
			conditionFulfillmentStore.set({ status: 'error', data: {}, error: err });
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

	function openBuildingInteractionDialog(state: NonNullable<BuildingInteractionDialogState>) {
		buildingInteractionDialogStore.set(state);
	}

	function closeBuildingInteractionDialog() {
		buildingInteractionDialogStore.set(undefined);
	}

	function openConditionDialog(state: NonNullable<ConditionDialogState>) {
		conditionDialogStore.set(state);
	}

	function closeConditionDialog() {
		conditionDialogStore.set(undefined);
	}

	// Getter functions
	function getBuilding(id: string): Building | undefined {
		return get(buildingStore).data[id as BuildingId];
	}

	function getBuildingItem(id: string): BuildingItem | undefined {
		return get(buildingItemStore).data[id as BuildingItemId];
	}

	function getBuildingStates(buildingId: string): BuildingState[] | undefined {
		return get(buildingStateStore).data[buildingId as BuildingId];
	}

	function getBuildingInteraction(id: string): BuildingInteraction | undefined {
		return get(buildingInteractionStore).data[id as BuildingInteractionId];
	}

	function getBuildingInteractionActions(
		buildingInteractionId: string
	): BuildingInteractionAction[] | undefined {
		return getBuildingInteractionActions(buildingInteractionId as BuildingInteractionId);
	}

	function getCondition(id: string): Condition | undefined {
		return get(conditionStore).data[id as ConditionId];
	}

	function getConditionFulfillment(id: string): ConditionFulfillment | undefined {
		return get(conditionFulfillmentStore).data[id as ConditionFulfillmentId];
	}

	function getBuildingCondition(id: string): BuildingCondition | undefined {
		return get(buildingConditionStore).data[id as BuildingConditionId];
	}

	function getConditionEffect(id: string): ConditionEffect | undefined {
		return get(conditionEffectStore).data[id as ConditionEffectId];
	}

	// GetAll functions
	function getAllBuildings(): Building[] {
		return Object.values(get(buildingStore).data);
	}

	function getAllBuildingItems(): BuildingItem[] {
		return Object.values(get(buildingItemStore).data);
	}

	function getAllBuildingStates(): Record<BuildingId, BuildingState[]> {
		return get(buildingStateStore).data;
	}

	function getAllBuildingInteractions(): BuildingInteraction[] {
		return Object.values(get(buildingInteractionStore).data);
	}

	function getAllBuildingInteractionActions(): Record<
		BuildingInteractionId,
		BuildingInteractionAction[]
	> {
		return get(buildingInteractionActionStore).data;
	}

	function getAllConditions(): Condition[] {
		return Object.values(get(conditionStore).data);
	}

	function getAllConditionFulfillments(): ConditionFulfillment[] {
		return Object.values(get(conditionFulfillmentStore).data);
	}

	function getAllBuildingConditions(): BuildingCondition[] {
		return Object.values(get(buildingConditionStore).data);
	}

	function getAllConditionEffects(): ConditionEffect[] {
		return Object.values(get(conditionEffectStore).data);
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

		async createBuildingInteraction(
			scenarioId: ScenarioId,
			interaction: Omit<BuildingInteractionInsert, 'scenario_id'>
		) {
			const { data, error } = await supabase
				.from('building_interactions')
				.insert({
					...interaction,
					scenario_id: scenarioId,
				})
				.select('*')
				.single<BuildingInteraction>();

			if (error) throw error;

			buildingInteractionStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as BuildingInteractionId] = data;
				})
			);

			buildingInteractionActionStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as BuildingInteractionId] = [];
				})
			);

			return data;
		},

		async updateBuildingInteraction(id: BuildingInteractionId, updates: BuildingInteractionUpdate) {
			const { error } = await supabase.from('building_interactions').update(updates).eq('id', id);

			if (error) throw error;

			buildingInteractionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data?.[id]) {
						Object.assign(draft.data[id], updates);
					}
				})
			);
		},

		async removeBuildingInteraction(id: BuildingInteractionId) {
			const { error } = await supabase.from('building_interactions').delete().eq('id', id);

			if (error) throw error;

			buildingInteractionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);

			buildingInteractionActionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data) {
						delete draft.data[id];
					}
				})
			);
		},

		async createBuildingInteractionAction(
			scenarioId: ScenarioId,
			buildingInteractionId: BuildingInteractionId,
			action: Omit<
				BuildingInteractionActionInsert,
				'scenario_id' | 'building_id' | 'building_interaction_id'
			>
		) {
			// Get building_id from interaction (nullable for default interactions)
			const buildingInteractionStoreValue = get(buildingInteractionStore);
			const buildingId =
				buildingInteractionStoreValue.data[buildingInteractionId]?.building_id || null;

			const { data, error } = await supabase
				.from('building_interaction_actions')
				.insert({
					...action,
					scenario_id: scenarioId,
					building_id: buildingId,
					building_interaction_id: buildingInteractionId,
				})
				.select()
				.single<BuildingInteractionAction>();

			if (error) throw error;

			buildingInteractionActionStore.update((s) =>
				produce(s, (draft) => {
					if (draft.data[buildingInteractionId]) {
						draft.data[buildingInteractionId].push(data);
					} else {
						draft.data[buildingInteractionId] = [data];
					}
				})
			);

			return data;
		},

		async updateBuildingInteractionAction(
			actionId: BuildingInteractionActionId,
			buildingInteractionId: BuildingInteractionId,
			updates: BuildingInteractionActionUpdate
		) {
			const { error } = await supabase
				.from('building_interaction_actions')
				.update(updates)
				.eq('id', actionId);

			if (error) throw error;

			buildingInteractionActionStore.update((s) =>
				produce(s, (draft) => {
					const actions = draft.data[buildingInteractionId];
					if (actions) {
						const action = actions.find((a) => a.id === actionId);
						if (action) {
							Object.assign(action, updates);
						}
					}
				})
			);
		},

		async removeBuildingInteractionAction(
			actionId: BuildingInteractionActionId,
			buildingInteractionId: BuildingInteractionId
		) {
			const { error } = await supabase
				.from('building_interaction_actions')
				.delete()
				.eq('id', actionId);

			if (error) throw error;

			buildingInteractionActionStore.update((s) =>
				produce(s, (draft) => {
					const actions = draft.data[buildingInteractionId];
					if (actions) {
						draft.data[buildingInteractionId] = actions.filter((a) => a.id !== actionId);
					}
				})
			);
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
		buildingInteractionStore: buildingInteractionStore as Readable<
			RecordFetchState<BuildingInteractionId, BuildingInteraction>
		>,
		buildingInteractionActionStore: buildingInteractionActionStore as Readable<
			RecordFetchState<BuildingInteractionId, BuildingInteractionAction[]>
		>,
		buildingDialogStore: buildingDialogStore as Readable<BuildingDialogState>,
		buildingInteractionDialogStore:
			buildingInteractionDialogStore as Readable<BuildingInteractionDialogState>,
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
		conditionDialogStore: conditionDialogStore as Readable<ConditionDialogState>,
		init,
		fetch,
		openBuildingDialog,
		closeBuildingDialog,
		openBuildingInteractionDialog,
		closeBuildingInteractionDialog,
		openConditionDialog,
		closeConditionDialog,
		getBuilding,
		getBuildingItem,
		getBuildingStates,
		getBuildingInteraction,
		getBuildingInteractionActions,
		getCondition,
		getConditionFulfillment,
		getBuildingCondition,
		getConditionEffect,
		getAllBuildings,
		getAllBuildingItems,
		getAllBuildingStates,
		getAllBuildingInteractions,
		getAllBuildingInteractionActions,
		getAllConditions,
		getAllConditionFulfillments,
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

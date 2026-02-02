import { get, writable, type Readable } from 'svelte/store';
import { produce } from 'immer';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';
import type {
	RecordFetchState,
	BehaviorPriority,
	BehaviorPriorityInsert,
	BehaviorPriorityUpdate,
	BehaviorPriorityId,
	Behavior,
	BehaviorAction,
	NeedBehavior,
	NeedBehaviorInsert,
	NeedBehaviorUpdate,
	NeedBehaviorAction,
	NeedBehaviorActionInsert,
	NeedBehaviorActionUpdate,
	NeedBehaviorId,
	NeedBehaviorActionId,
	ConditionBehavior,
	ConditionBehaviorInsert,
	ConditionBehaviorUpdate,
	ConditionBehaviorAction,
	ConditionBehaviorActionInsert,
	ConditionBehaviorActionUpdate,
	ConditionBehaviorId,
	ConditionBehaviorActionId,
	ScenarioId,
	WorldCharacterId,
	BehaviorTargetId,
	WorldCharacterEntityBehavior,
} from '$lib/types';
import { useApp } from '../use-app.svelte';
import type { Behavior as WorldBehavior } from '$lib/components/app/world/behaviors';
import { getInteractableEntityTemplates } from './get-interactable-entity-templates';

type BehaviorPriorityDialogState =
	| { type: 'create' }
	| { type: 'update'; behaviorPriorityId: BehaviorPriorityId }
	| { type: 'delete'; behaviorPriorityId: BehaviorPriorityId }
	| undefined;

type NeedBehaviorDialogState =
	| { type: 'create' }
	| { type: 'update'; needBehaviorId: NeedBehaviorId }
	| { type: 'delete'; needBehaviorId: NeedBehaviorId }
	| undefined;

type ConditionBehaviorDialogState =
	| { type: 'create' }
	| { type: 'update'; conditionBehaviorId: ConditionBehaviorId }
	| { type: 'delete'; conditionBehaviorId: ConditionBehaviorId }
	| undefined;

// Runtime behavior instance management
const behaviorInstanceMap = new Map<WorldCharacterId, WorldBehavior[]>();

let instance: ReturnType<typeof createBehaviorStore> | null = null;

function createBehaviorStore() {
	const { supabase } = useApp();

	const behaviorPriorityStore = writable<RecordFetchState<BehaviorPriorityId, BehaviorPriority>>({
		status: 'idle',
		data: {},
	});

	const needBehaviorStore = writable<RecordFetchState<NeedBehaviorId, NeedBehavior>>({
		status: 'idle',
		data: {},
	});

	const needBehaviorActionStore = writable<
		RecordFetchState<NeedBehaviorActionId, NeedBehaviorAction>
	>({
		status: 'idle',
		data: {},
	});

	const conditionBehaviorStore = writable<RecordFetchState<ConditionBehaviorId, ConditionBehavior>>(
		{
			status: 'idle',
			data: {},
		}
	);

	const conditionBehaviorActionStore = writable<
		RecordFetchState<ConditionBehaviorActionId, ConditionBehaviorAction>
	>({
		status: 'idle',
		data: {},
	});

	const behaviorPriorityDialogStore = writable<BehaviorPriorityDialogState>(undefined);
	const needBehaviorDialogStore = writable<NeedBehaviorDialogState>(undefined);
	const conditionBehaviorDialogStore = writable<ConditionBehaviorDialogState>(undefined);

	let initialized = false;

	function init() {
		initialized = true;
	}

	async function fetch() {
		if (!initialized) {
			throw new Error('useBehavior not initialized. Call init() first.');
		}

		behaviorPriorityStore.update((state) => ({ ...state, status: 'loading' }));
		needBehaviorStore.update((state) => ({ ...state, status: 'loading' }));
		needBehaviorActionStore.update((state) => ({ ...state, status: 'loading' }));
		conditionBehaviorStore.update((state) => ({ ...state, status: 'loading' }));
		conditionBehaviorActionStore.update((state) => ({ ...state, status: 'loading' }));

		try {
			const [
				prioritiesResult,
				needBehaviorsResult,
				needBehaviorActionsResult,
				conditionBehaviorsResult,
				conditionBehaviorActionsResult,
			] = await Promise.all([
				supabase.from('behavior_priorities').select('*').order('priority'),
				supabase.from('need_behaviors').select('*').order('name'),
				supabase.from('need_behavior_actions').select('*'),
				supabase.from('condition_behaviors').select('*'),
				supabase.from('condition_behavior_actions').select('*'),
			]);

			if (prioritiesResult.error) throw prioritiesResult.error;
			if (needBehaviorsResult.error) throw needBehaviorsResult.error;
			if (needBehaviorActionsResult.error) throw needBehaviorActionsResult.error;
			if (conditionBehaviorsResult.error) throw conditionBehaviorsResult.error;
			if (conditionBehaviorActionsResult.error) throw conditionBehaviorActionsResult.error;

			const priorityRecord: Record<BehaviorPriorityId, BehaviorPriority> = {};
			for (const item of prioritiesResult.data ?? []) {
				priorityRecord[item.id as BehaviorPriorityId] = item as BehaviorPriority;
			}

			const needBehaviorRecord: Record<NeedBehaviorId, NeedBehavior> = {};
			for (const item of needBehaviorsResult.data ?? []) {
				needBehaviorRecord[item.id as NeedBehaviorId] = item as NeedBehavior;
			}

			const needBehaviorActionRecord: Record<NeedBehaviorActionId, NeedBehaviorAction> = {};
			for (const item of needBehaviorActionsResult.data ?? []) {
				needBehaviorActionRecord[item.id as NeedBehaviorActionId] = item as NeedBehaviorAction;
			}

			const conditionBehaviorRecord: Record<ConditionBehaviorId, ConditionBehavior> = {};
			for (const item of conditionBehaviorsResult.data ?? []) {
				conditionBehaviorRecord[item.id as ConditionBehaviorId] = item as ConditionBehavior;
			}

			const conditionBehaviorActionRecord: Record<
				ConditionBehaviorActionId,
				ConditionBehaviorAction
			> = {};
			for (const item of conditionBehaviorActionsResult.data ?? []) {
				conditionBehaviorActionRecord[item.id as ConditionBehaviorActionId] =
					item as ConditionBehaviorAction;
			}

			behaviorPriorityStore.set({ status: 'success', data: priorityRecord });
			needBehaviorStore.set({ status: 'success', data: needBehaviorRecord });
			needBehaviorActionStore.set({ status: 'success', data: needBehaviorActionRecord });
			conditionBehaviorStore.set({ status: 'success', data: conditionBehaviorRecord });
			conditionBehaviorActionStore.set({ status: 'success', data: conditionBehaviorActionRecord });
		} catch (error) {
			const err = error instanceof Error ? error : new Error('Unknown error');
			behaviorPriorityStore.set({ status: 'error', data: {}, error: err });
			needBehaviorStore.set({ status: 'error', data: {}, error: err });
			needBehaviorActionStore.set({ status: 'error', data: {}, error: err });
			conditionBehaviorStore.set({ status: 'error', data: {}, error: err });
			conditionBehaviorActionStore.set({ status: 'error', data: {}, error: err });
		}
	}

	function openBehaviorPriorityDialog(state: NonNullable<BehaviorPriorityDialogState>) {
		behaviorPriorityDialogStore.set(state);
	}

	function closeBehaviorPriorityDialog() {
		behaviorPriorityDialogStore.set(undefined);
	}

	function openNeedBehaviorDialog(state: NonNullable<NeedBehaviorDialogState>) {
		needBehaviorDialogStore.set(state);
	}

	function closeNeedBehaviorDialog() {
		needBehaviorDialogStore.set(undefined);
	}

	function openConditionBehaviorDialog(state: NonNullable<ConditionBehaviorDialogState>) {
		conditionBehaviorDialogStore.set(state);
	}

	function closeConditionBehaviorDialog() {
		conditionBehaviorDialogStore.set(undefined);
	}

	// Getter functions
	function getBehaviorPriority(id: string): BehaviorPriority | undefined {
		return get(behaviorPriorityStore).data[id as BehaviorPriorityId];
	}

	function getNeedBehavior(id: string): NeedBehavior | undefined {
		return get(needBehaviorStore).data[id as NeedBehaviorId];
	}

	function getNeedBehaviorAction(id: string): NeedBehaviorAction | undefined {
		return get(needBehaviorActionStore).data[id as NeedBehaviorActionId];
	}

	function getConditionBehavior(id: string): ConditionBehavior | undefined {
		return get(conditionBehaviorStore).data[id as ConditionBehaviorId];
	}

	function getConditionBehaviorAction(id: string): ConditionBehaviorAction | undefined {
		return get(conditionBehaviorActionStore).data[id as ConditionBehaviorActionId];
	}

	function getBehaviorAction(
		behaviorTargetId: BehaviorTargetId | undefined
	): BehaviorAction | undefined {
		if (!behaviorTargetId) return undefined;

		const { type } = BehaviorIdUtils.parse(behaviorTargetId);
		const behaviorActionId = BehaviorIdUtils.behaviorActionId(behaviorTargetId);

		const plainAction =
			type === 'need'
				? getNeedBehaviorAction(behaviorActionId)
				: getConditionBehaviorAction(behaviorActionId);

		return plainAction ? BehaviorIdUtils.to(plainAction) : undefined;
	}

	// GetAll functions
	function getAllBehaviorPriorities(): BehaviorPriority[] {
		return Object.values(get(behaviorPriorityStore).data);
	}

	function getAllNeedBehaviors(): NeedBehavior[] {
		return Object.values(get(needBehaviorStore).data);
	}

	function getAllNeedBehaviorActions(): NeedBehaviorAction[] {
		return Object.values(get(needBehaviorActionStore).data);
	}

	function getAllConditionBehaviors(): ConditionBehavior[] {
		return Object.values(get(conditionBehaviorStore).data);
	}

	function getAllConditionBehaviorActions(): ConditionBehaviorAction[] {
		return Object.values(get(conditionBehaviorActionStore).data);
	}

	function getAllBehaviors(): Behavior[] {
		const needBehaviors = getAllNeedBehaviors().map(BehaviorIdUtils.behavior.to);
		const conditionBehaviors = getAllConditionBehaviors().map(BehaviorIdUtils.behavior.to);
		return [...needBehaviors, ...conditionBehaviors];
	}

	function getAllUsableBehaviors(
		worldCharacterEntityBehavior: WorldCharacterEntityBehavior
	): Behavior[] {
		const priorities = get(behaviorPriorityStore).data;

		const candidateBehaviors = getAllBehaviors().filter((behavior) => {
			if (behavior.behaviorType === 'need') {
				const need = worldCharacterEntityBehavior.worldCharacterEntity.needs[behavior.need_id];
				if (!need) return false;
				// 욕구 레벨이 threshold 이하이면 발동
				return need.value <= behavior.need_threshold;
			} else {
				// TODO: 컨디션 조건 체크 로직 (나중에 구현)
				return false;
			}
		});

		return candidateBehaviors.sort((a, b) => {
			const priorityA = Object.values(priorities).find((p) =>
				a.behaviorType === 'need' ? p.need_behavior_id === a.id : p.condition_behavior_id === a.id
			);
			const priorityB = Object.values(priorities).find((p) =>
				b.behaviorType === 'need' ? p.need_behavior_id === b.id : p.condition_behavior_id === b.id
			);

			const valA = priorityA?.priority ?? 0;
			const valB = priorityB?.priority ?? 0;

			// 높은 우선순위가 먼저 오도록 내림차순 정렬
			return valB - valA;
		});
	}

	function getRootBehaviorAction(behavior: Behavior): BehaviorAction | undefined {
		if (behavior.behaviorType === 'need') {
			const needAction = getAllNeedBehaviorActions().find(
				(action) => action.need_behavior_id === behavior.id && action.root
			);
			return needAction ? BehaviorIdUtils.to(needAction) : undefined;
		} else {
			const conditionAction = getAllConditionBehaviorActions().find(
				(action) => action.condition_behavior_id === behavior.id && action.root
			);
			return conditionAction ? BehaviorIdUtils.to(conditionAction) : undefined;
		}
	}

	const admin = {
		// BehaviorPriority CRUD
		async createBehaviorPriority(
			scenarioId: ScenarioId,
			priority: Omit<BehaviorPriorityInsert, 'scenario_id'>
		) {
			const result = await supabase
				.from('behavior_priorities')
				.insert({ ...priority, scenario_id: scenarioId })
				.select()
				.single();

			if (result.error) throw result.error;

			const newPriority = result.data as BehaviorPriority;

			behaviorPriorityStore.update((state) =>
				produce(state, (draft) => {
					draft.data[newPriority.id as BehaviorPriorityId] = newPriority;
				})
			);

			return newPriority;
		},

		async updateBehaviorPriority(id: BehaviorPriorityId, priority: BehaviorPriorityUpdate) {
			const result = await supabase
				.from('behavior_priorities')
				.update(priority)
				.eq('id', id)
				.select()
				.single();

			if (result.error) throw result.error;

			const updated = result.data as BehaviorPriority;

			behaviorPriorityStore.update((state) =>
				produce(state, (draft) => {
					draft.data[id] = updated;
				})
			);

			return updated;
		},

		async removeBehaviorPriority(id: BehaviorPriorityId) {
			const result = await supabase.from('behavior_priorities').delete().eq('id', id);

			if (result.error) throw result.error;

			behaviorPriorityStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
				})
			);
		},

		// NeedBehavior CRUD
		async createNeedBehavior(
			scenarioId: ScenarioId,
			behavior: Omit<NeedBehaviorInsert, 'scenario_id'>
		) {
			const { data, error } = await supabase
				.from('need_behaviors')
				.insert({ ...behavior, scenario_id: scenarioId })
				.select()
				.single<NeedBehavior>();

			if (error) throw error;

			needBehaviorStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as NeedBehaviorId] = data;
				})
			);

			return data;
		},

		async updateNeedBehavior(id: NeedBehaviorId, behavior: NeedBehaviorUpdate) {
			const { error } = await supabase.from('need_behaviors').update(behavior).eq('id', id);

			if (error) throw error;

			needBehaviorStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data[id]) {
						Object.assign(draft.data[id], behavior);
					}
				})
			);
		},

		async removeNeedBehavior(id: NeedBehaviorId) {
			const { error } = await supabase.from('need_behaviors').delete().eq('id', id);

			if (error) throw error;

			needBehaviorStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
				})
			);

			// Also remove related actions from the store
			needBehaviorActionStore.update((state) =>
				produce(state, (draft) => {
					for (const actionId of Object.keys(draft.data) as NeedBehaviorActionId[]) {
						if (draft.data[actionId]?.need_behavior_id === id) {
							delete draft.data[actionId];
						}
					}
				})
			);
		},

		// NeedBehaviorAction CRUD
		async createNeedBehaviorAction(
			scenarioId: ScenarioId,
			action: Omit<NeedBehaviorActionInsert, 'scenario_id'>
		) {
			// 해당 behavior에 첫 번째 액션이면 자동으로 root로 설정
			const existingActions = getAllNeedBehaviorActions();
			const isFirstAction = !existingActions.some(
				(a) => a.need_behavior_id === action.need_behavior_id
			);

			const { data, error } = await supabase
				.from('need_behavior_actions')
				.insert({ ...action, scenario_id: scenarioId, root: isFirstAction })
				.select()
				.single<NeedBehaviorAction>();

			if (error) throw error;

			needBehaviorActionStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as NeedBehaviorActionId] = data;
				})
			);

			return data;
		},

		async updateNeedBehaviorAction(id: NeedBehaviorActionId, action: NeedBehaviorActionUpdate) {
			const { error } = await supabase.from('need_behavior_actions').update(action).eq('id', id);

			if (error) throw error;

			needBehaviorActionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data[id]) {
						Object.assign(draft.data[id], action);
					}
				})
			);
		},

		async removeNeedBehaviorAction(id: NeedBehaviorActionId) {
			const { error } = await supabase.from('need_behavior_actions').delete().eq('id', id);

			if (error) throw error;

			needBehaviorActionStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
				})
			);
		},

		// ConditionBehavior CRUD
		async createConditionBehavior(
			scenarioId: ScenarioId,
			behavior: Omit<ConditionBehaviorInsert, 'scenario_id'>
		) {
			const { data, error } = await supabase
				.from('condition_behaviors')
				.insert({ ...behavior, scenario_id: scenarioId })
				.select()
				.single<ConditionBehavior>();

			if (error) throw error;

			conditionBehaviorStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as ConditionBehaviorId] = data;
				})
			);

			return data;
		},

		async updateConditionBehavior(id: ConditionBehaviorId, behavior: ConditionBehaviorUpdate) {
			const { error } = await supabase.from('condition_behaviors').update(behavior).eq('id', id);

			if (error) throw error;

			conditionBehaviorStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data[id]) {
						Object.assign(draft.data[id], behavior);
					}
				})
			);
		},

		async removeConditionBehavior(id: ConditionBehaviorId) {
			const { error } = await supabase.from('condition_behaviors').delete().eq('id', id);

			if (error) throw error;

			conditionBehaviorStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
				})
			);

			// Also remove related actions from the store
			conditionBehaviorActionStore.update((state) =>
				produce(state, (draft) => {
					for (const actionId of Object.keys(draft.data) as ConditionBehaviorActionId[]) {
						if (draft.data[actionId]?.condition_behavior_id === id) {
							delete draft.data[actionId];
						}
					}
				})
			);
		},

		// ConditionBehaviorAction CRUD
		async createConditionBehaviorAction(
			scenarioId: ScenarioId,
			action: Omit<ConditionBehaviorActionInsert, 'scenario_id'>
		) {
			// 해당 behavior에 첫 번째 액션이면 자동으로 root로 설정
			const existingActions = getAllConditionBehaviorActions();
			const isFirstAction = !existingActions.some(
				(a) => a.condition_behavior_id === action.condition_behavior_id
			);

			const { data, error } = await supabase
				.from('condition_behavior_actions')
				.insert({ ...action, scenario_id: scenarioId, root: isFirstAction })
				.select()
				.single<ConditionBehaviorAction>();

			if (error) throw error;

			conditionBehaviorActionStore.update((state) =>
				produce(state, (draft) => {
					draft.data[data.id as ConditionBehaviorActionId] = data;
				})
			);

			return data;
		},

		async updateConditionBehaviorAction(
			id: ConditionBehaviorActionId,
			action: ConditionBehaviorActionUpdate
		) {
			const { error } = await supabase
				.from('condition_behavior_actions')
				.update(action)
				.eq('id', id);

			if (error) throw error;

			conditionBehaviorActionStore.update((state) =>
				produce(state, (draft) => {
					if (draft.data[id]) {
						Object.assign(draft.data[id], action);
					}
				})
			);
		},

		async removeConditionBehaviorAction(id: ConditionBehaviorActionId) {
			const { error } = await supabase.from('condition_behavior_actions').delete().eq('id', id);

			if (error) throw error;

			conditionBehaviorActionStore.update((state) =>
				produce(state, (draft) => {
					delete draft.data[id];
				})
			);
		},
	};

	// Runtime behavior instance management
	function getBehavior(worldCharacterId: WorldCharacterId): WorldBehavior | undefined {
		const behaviors = behaviorInstanceMap.get(worldCharacterId);
		if (!behaviors || behaviors.length === 0) {
			return undefined;
		}

		// 우선도가 가장 높은 행동 반환
		return behaviors.reduce((prev, current) =>
			current.getPriority() > prev.getPriority() ? current : prev
		);
	}

	function addBehavior(worldCharacterId: WorldCharacterId, behavior: WorldBehavior): void {
		const behaviors = behaviorInstanceMap.get(worldCharacterId) ?? [];
		behaviors.push(behavior);
		behaviorInstanceMap.set(worldCharacterId, behaviors);
	}

	function removeBehavior(worldCharacterId: WorldCharacterId, behaviorId: string): void {
		const behaviors = behaviorInstanceMap.get(worldCharacterId);
		if (!behaviors) return;

		const filtered = behaviors.filter((b) => b.id !== behaviorId);
		behaviorInstanceMap.set(worldCharacterId, filtered);
	}

	function clearBehaviors(worldCharacterId: WorldCharacterId): void {
		behaviorInstanceMap.delete(worldCharacterId);
	}

	return {
		behaviorPriorityStore,
		needBehaviorStore: needBehaviorStore as Readable<
			RecordFetchState<NeedBehaviorId, NeedBehavior>
		>,
		needBehaviorActionStore: needBehaviorActionStore as Readable<
			RecordFetchState<NeedBehaviorActionId, NeedBehaviorAction>
		>,
		conditionBehaviorStore: conditionBehaviorStore as Readable<
			RecordFetchState<ConditionBehaviorId, ConditionBehavior>
		>,
		conditionBehaviorActionStore: conditionBehaviorActionStore as Readable<
			RecordFetchState<ConditionBehaviorActionId, ConditionBehaviorAction>
		>,
		behaviorPriorityDialogStore,
		needBehaviorDialogStore: needBehaviorDialogStore as Readable<NeedBehaviorDialogState>,
		conditionBehaviorDialogStore:
			conditionBehaviorDialogStore as Readable<ConditionBehaviorDialogState>,
		init,
		fetch,
		openBehaviorPriorityDialog,
		closeBehaviorPriorityDialog,
		openNeedBehaviorDialog,
		closeNeedBehaviorDialog,
		openConditionBehaviorDialog,
		closeConditionBehaviorDialog,
		getBehaviorPriority,
		getNeedBehavior,
		getNeedBehaviorAction,
		getConditionBehavior,
		getConditionBehaviorAction,
		getBehaviorAction,
		getAllBehaviorPriorities,
		getAllNeedBehaviors,
		getAllNeedBehaviorActions,
		getAllConditionBehaviors,
		getAllConditionBehaviorActions,
		getAllBehaviors,
		getAllUsableBehaviors,
		getRootBehaviorAction,
		getBehavior,
		addBehavior,
		removeBehavior,
		clearBehaviors,
		getInteractableEntityTemplates,
		admin,
	};
}

export function useBehavior() {
	if (!instance) {
		instance = createBehaviorStore();
	}
	return instance;
}

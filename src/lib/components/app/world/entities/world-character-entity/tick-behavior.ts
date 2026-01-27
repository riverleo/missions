import { get } from 'svelte/store';
import type {
	WorldItemId,
	NeedBehaviorActionId,
	ConditionBehaviorActionId,
	NeedBehaviorId,
	ConditionBehaviorId,
	ConditionBehavior,
	EntityId,
} from '$lib/types';
import type { WorldCharacterEntity } from './world-character-entity.svelte';
import { useBehavior } from '$lib/hooks/use-behavior';
import { useWorld } from '$lib/hooks/use-world';
import { BehaviorActionIdUtils } from '$lib/utils/behavior-action-id';
import { EntityIdUtils } from '$lib/utils/entity-id';

/**
 * 캐릭터의 행동을 tick마다 처리
 */
export function tickBehavior(entity: WorldCharacterEntity, tick: number): void {
	const { needBehaviorActionStore, conditionBehaviorActionStore } = useBehavior();

	// 현재 행동 액션이 없으면 새로운 행동 선택
	if (!entity.currentBehaviorActionId) {
		selectNewBehavior(entity, tick);
		return;
	}

	// 현재 행동 액션 가져오기
	const { type } = BehaviorActionIdUtils.parse(entity.currentBehaviorActionId);

	const action =
		type === 'need'
			? get(needBehaviorActionStore).data[
					BehaviorActionIdUtils.actionId<NeedBehaviorActionId>(entity.currentBehaviorActionId)
				]
			: get(conditionBehaviorActionStore).data[
					BehaviorActionIdUtils.actionId<ConditionBehaviorActionId>(entity.currentBehaviorActionId)
				];

	if (!action) {
		// 액션을 찾을 수 없으면 행동 종료
		console.log('[tickBehavior] action not found:', entity.currentBehaviorActionId);
		entity.currentBehaviorActionId = undefined;
		return;
	}

	console.log('[tickBehavior]', {
		entity: entity.id.split('-')[0],
		actionType: action.type,
		behaviorInteractType: action.behavior_interact_type,
		pathLength: entity.path.length,
		targetEntityId: entity.currentTargetEntityId,
	});

	// 1. Search: path가 없고 타겟이 없으면 대상 탐색 및 경로 설정
	if (
		(action.type === 'go' || action.type === 'interact') &&
		entity.path.length === 0 &&
		!entity.currentTargetEntityId
	) {
		console.log('[tickBehavior] searching target...');
		searchTargetAndSetPath(entity, action);
		return; // 경로 설정 후 다음 tick에서 실행
	}

	// 2. Go or Interact: 행동 실행
	if (action.type === 'go') {
		executeGoAction(entity, action);
	} else if (action.type === 'interact') {
		executeInteractAction(entity, action);
	} else if (action.type === 'idle') {
		executeIdleAction(entity, action);
	}

	// 3. Do until behavior_completion_type: 완료 조건 확인
	const isCompleted = checkActionCompletion(entity, action, tick);
	if (isCompleted) {
		transitionToNextAction(entity, action, tick);
	}
}

/**
 * 대상 탐색 및 경로 설정 (target_selection_method에 따라)
 */
function searchTargetAndSetPath(
	entity: WorldCharacterEntity,
	action: {
		target_selection_method: string;
		behavior_interact_type: string;
		building_id?: string | null;
		item_id?: string | null;
		character_id?: string | null;
	}
): void {
	const { getInteractableEntityTemplates } = useBehavior();
	const { worldBuildingStore, worldItemStore } = useWorld();
	const worldEntities = Object.values(entity.worldContext.entities);

	console.log('[searchTargetAndSetPath]', {
		targetSelectionMethod: action.target_selection_method,
		behaviorInteractType: action.behavior_interact_type,
		worldEntitiesCount: worldEntities.length,
	});

	let targetEntity: any = undefined;

	if (action.target_selection_method === 'explicit') {
		// explicit: 지정된 대상으로 이동
		if (action.building_id) {
			targetEntity = worldEntities.find(
				(e) => e.type === 'building' && e.instanceId === action.building_id
			);
		} else if (action.item_id) {
			targetEntity = worldEntities.find(
				(e) => e.type === 'item' && e.instanceId === action.item_id
			);
		}
	} else if (
		action.target_selection_method === 'search' ||
		action.target_selection_method === 'search_or_continue'
	) {
		// search: 상호작용 가능한 대상 중 가장 가까운 것 선택
		const templates = getInteractableEntityTemplates(action as any);

		// 템플릿 ID 집합
		const templateIds = new Set(templates.map((t) => t.id));

		// 템플릿에 해당하는 월드 엔티티 찾기
		const candidateEntities = worldEntities.filter((e) => {
			if (e.type === 'building') {
				const worldBuilding = get(worldBuildingStore).data[e.instanceId as any];
				return worldBuilding && templateIds.has(worldBuilding.building_id);
			} else if (e.type === 'item') {
				const worldItem = get(worldItemStore).data[e.instanceId as any];
				return worldItem && templateIds.has(worldItem.item_id);
			}
			return false;
		});

		// 가장 가까운 엔티티 선택
		if (candidateEntities.length > 0) {
			targetEntity = candidateEntities.reduce((closest, current) => {
				const distToCurrent = Math.hypot(current.x - entity.x, current.y - entity.y);
				const distToClosest = Math.hypot(closest.x - entity.x, closest.y - entity.y);
				return distToCurrent < distToClosest ? current : closest;
			});
		}
	}

	// 대상을 찾았으면 타겟 설정 및 경로 설정
	if (targetEntity) {
		console.log('[searchTargetAndSetPath] target found:', {
			targetId: targetEntity.id,
			targetType: targetEntity.type,
			targetPosition: { x: targetEntity.x, y: targetEntity.y },
		});
		entity.currentTargetEntityId = targetEntity.id as EntityId;
		entity.moveTo(targetEntity.x, targetEntity.y);
	} else {
		console.log('[searchTargetAndSetPath] no target found');
	}
}

/**
 * GO 행동 실행 (이동)
 */
function executeGoAction(entity: WorldCharacterEntity, action: any): void {
	// path를 따라 이동하는 로직은 updateMove에서 처리
	// 여기서는 특별히 할 일이 없음 (완료 조건만 체크)
}

/**
 * INTERACT 행동 실행 (상호작용)
 */
function executeInteractAction(entity: WorldCharacterEntity, action: any): void {
	if (!entity.currentTargetEntityId) {
		console.log('[executeInteractAction] no target entity id');
		return;
	}

	const targetEntity = entity.worldContext.entities[entity.currentTargetEntityId];
	if (!targetEntity) {
		// 타겟이 사라졌으면 타겟 클리어하고 재탐색
		console.log('[executeInteractAction] target entity disappeared');
		entity.currentTargetEntityId = undefined;
		entity.path = [];
		return;
	}

	// 타겟과의 거리 확인 (임계값: 50)
	const distance = Math.hypot(targetEntity.x - entity.x, targetEntity.y - entity.y);
	console.log('[executeInteractAction]', {
		targetType: targetEntity.type,
		distance,
		threshold: 50,
	});

	if (distance >= 50) {
		// 아직 도착하지 않았으면 대기
		return;
	}

	const interactType = action.behavior_interact_type;
	console.log('[executeInteractAction] interacting:', interactType);

	if (interactType === 'item_pick') {
		console.log('[executeInteractAction] item_pick - targetEntity.type:', targetEntity.type);
		if (targetEntity.type === 'item') {
			const { worldItemStore } = useWorld();
			const worldItemId = targetEntity.instanceId as WorldItemId;

			console.log('[executeInteractAction] picking up item:', worldItemId);

			// 아이템 줍기: heldWorldItemIds에 추가
			if (!entity.heldWorldItemIds.includes(worldItemId)) {
				entity.heldWorldItemIds.push(worldItemId);
				console.log('[executeInteractAction] added to heldWorldItemIds');
			}

			// 바디만 월드에서 제거 (엔티티는 삭제 X)
			targetEntity.removeFromWorld();
			console.log('[executeInteractAction] removed from world');

			// worldItem.world_character_id 업데이트
			const worldItem = get(worldItemStore).data[worldItemId];
			if (worldItem) {
				worldItemStore.update((state) => ({
					...state,
					data: {
						...state.data,
						[worldItemId]: {
							...worldItem,
							world_character_id: entity.instanceId,
							world_building_id: null,
						},
					},
				}));
				console.log('[executeInteractAction] updated worldItem ownership');
			}

			// 타겟 클리어
			entity.currentTargetEntityId = undefined;
			console.log('[executeInteractAction] item pick completed');
		}
	} else if (interactType === 'item_use') {
		// TODO: heldWorldItemIds에서 아이템 사용
		// 아이템 사용 로직은 아이템 타입에 따라 다름
	} else if (
		interactType === 'building_execute' ||
		interactType === 'building_repair' ||
		interactType === 'building_clean'
	) {
		if (targetEntity.type === 'building') {
			// TODO: 건물과 상호작용 (캐릭터 숨김, 건물 점유 등)
			// 현재는 구현 보류
		}
	}
}

/**
 * IDLE 행동 실행 (대기)
 */
function executeIdleAction(entity: WorldCharacterEntity, action: any): void {
	// 대기는 특별히 할 일이 없음
	// 완료 조건만 체크 (duration_ticks)
}

/**
 * 행동 완료 조건 확인
 */
function checkActionCompletion(
	entity: WorldCharacterEntity,
	action: any,
	currentTick: number
): boolean {
	// GO: path가 비면 완료
	if (action.type === 'go') {
		return entity.path.length === 0;
	}

	// INTERACT/IDLE: behavior_completion_type에 따라
	if (action.behavior_completion_type === 'immediate') {
		// interact 액션의 경우, 타겟과의 거리가 가까울 때만 완료 (실제로 상호작용 완료)
		if (action.type === 'interact') {
			if (!entity.currentTargetEntityId) return false;
			const targetEntity = entity.worldContext.entities[entity.currentTargetEntityId];
			if (!targetEntity) return false;
			const distance = Math.hypot(targetEntity.x - entity.x, targetEntity.y - entity.y);
			return distance < 50;
		}
		// idle 액션은 즉시 완료
		return true;
	}

	if (action.behavior_completion_type === 'fixed') {
		// interact 액션: 타겟에 도착했고 duration_ticks 경과
		if (action.type === 'interact') {
			if (!entity.currentTargetEntityId) return false;
			const targetEntity = entity.worldContext.entities[entity.currentTargetEntityId];
			if (!targetEntity) return false;
			const distance = Math.hypot(targetEntity.x - entity.x, targetEntity.y - entity.y);
			if (distance >= 50) return false; // 아직 도착하지 않음
			return currentTick - entity.actionStartTick >= action.duration_ticks;
		}
		// idle 액션: duration_ticks 경과 확인
		return currentTick - entity.actionStartTick >= action.duration_ticks;
	}

	if (action.behavior_completion_type === 'completion') {
		// TODO: 목표 달성 여부 확인 (건물 수리/청소 완료 등)
		return false;
	}

	return false;
}

/**
 * 다음 액션으로 전환
 */
function transitionToNextAction(
	entity: WorldCharacterEntity,
	action: any,
	currentTick: number
): void {
	if (!entity.currentBehaviorActionId) return;

	const { type } = BehaviorActionIdUtils.parse(entity.currentBehaviorActionId);
	const behaviorId = BehaviorActionIdUtils.behaviorId(entity.currentBehaviorActionId);

	// 현재 액션 완료 시 path와 타겟 클리어
	entity.path = [];
	entity.currentTargetEntityId = undefined;

	// 다음 액션 ID 가져오기
	const nextActionId =
		type === 'need'
			? action.next_need_behavior_action_id
			: action.next_condition_behavior_action_id;

	if (nextActionId) {
		// 다음 액션으로 전환
		entity.currentBehaviorActionId = BehaviorActionIdUtils.create(type, behaviorId, nextActionId);
		entity.actionStartTick = currentTick;
	} else {
		// 다음 액션이 없으면 행동 종료
		entity.currentBehaviorActionId = undefined;
		entity.actionStartTick = 0;
	}
}

/**
 * 새로운 행동을 선택 (우선순위 기반)
 */
function selectNewBehavior(entity: WorldCharacterEntity, tick: number): void {
	const {
		needBehaviorStore,
		needBehaviorActionStore,
		conditionBehaviorStore,
		conditionBehaviorActionStore,
		behaviorPriorityStore,
	} = useBehavior();

	const allNeedBehaviors = Object.values(get(needBehaviorStore).data);
	const allNeedBehaviorActions = Object.values(get(needBehaviorActionStore).data);

	console.log('[selectNewBehavior]', {
		entity: entity.id,
		allNeedBehaviors: allNeedBehaviors.length,
		allNeedBehaviorActions: allNeedBehaviorActions.length,
		needs: entity.worldCharacterNeeds,
	});

	// 1. 후보 need behaviors 찾기 (threshold 이하인 욕구)
	const candidateNeedBehaviors = allNeedBehaviors.filter((behavior) => {
		const need = entity.worldCharacterNeeds[behavior.need_id];
		if (!need) return false;

		// 욕구 레벨이 threshold 이하이면 발동
		return need.value <= behavior.need_threshold;
	});

	// 2. 후보 condition behaviors 찾기
	// TODO: 컨디션 조건 체크 로직 (나중에 구현)
	const candidateConditionBehaviors: ConditionBehavior[] = [];

	// 3. 우선순위에 따라 정렬
	const allCandidates: Array<
		| { type: 'need'; behaviorId: NeedBehaviorId }
		| { type: 'condition'; behaviorId: ConditionBehaviorId }
	> = [
		...candidateNeedBehaviors.map((behavior) => ({
			type: 'need' as const,
			behaviorId: behavior.id,
		})),
		...candidateConditionBehaviors.map((behavior) => ({
			type: 'condition' as const,
			behaviorId: behavior.id,
		})),
	];

	console.log('[selectNewBehavior] candidates:', {
		needBehaviors: candidateNeedBehaviors.length,
		conditionBehaviors: candidateConditionBehaviors.length,
		total: allCandidates.length,
	});

	if (allCandidates.length === 0) {
		// 후보가 없으면 종료
		return;
	}

	// BehaviorPriority에서 우선순위 가져오기
	const priorities = get(behaviorPriorityStore).data;
	const sortedCandidates = allCandidates.sort((a, b) => {
		const priorityA = Object.values(priorities).find((p) =>
			a.type === 'need'
				? p.need_behavior_id === a.behaviorId
				: p.condition_behavior_id === a.behaviorId
		);
		const priorityB = Object.values(priorities).find((p) =>
			b.type === 'need'
				? p.need_behavior_id === b.behaviorId
				: p.condition_behavior_id === b.behaviorId
		);

		const valA = priorityA?.priority ?? 0;
		const valB = priorityB?.priority ?? 0;

		// 높은 우선순위가 먼저 오도록 내림차순 정렬
		return valB - valA;
	});

	const selected = sortedCandidates[0];
	if (!selected) return;

	// 4. root action 찾기
	const actions =
		selected.type === 'need'
			? Object.values(get(needBehaviorActionStore).data).filter(
					(a) => a.behavior_id === selected.behaviorId && a.root
				)
			: Object.values(get(conditionBehaviorActionStore).data).filter(
					(a) => a.condition_behavior_id === selected.behaviorId && a.root
				);

	const rootAction = actions[0];
	if (!rootAction) {
		// root action이 없으면 종료
		return;
	}

	// 5. currentBehaviorActionId 설정 및 시작 tick 기록
	entity.currentBehaviorActionId = BehaviorActionIdUtils.create(
		selected.type,
		selected.behaviorId,
		rootAction.id
	);
	entity.actionStartTick = tick;

	console.log('[selectNewBehavior] selected:', {
		behaviorId: selected.behaviorId,
		actionId: rootAction.id,
		currentBehaviorActionId: entity.currentBehaviorActionId,
	});
}

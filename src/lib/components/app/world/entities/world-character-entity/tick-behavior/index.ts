import type {
	NeedBehaviorActionId,
	ConditionBehaviorActionId,
	WorldBuildingId,
	WorldItemId,
	WorldCharacterId,
	BehaviorAction,
} from '$lib/types';
import type { WorldCharacterEntity } from '../world-character-entity.svelte';
import { useBehavior } from '$lib/hooks/use-behavior';
import { useWorld } from '$lib/hooks/use-world';
import { useBuilding } from '$lib/hooks/use-building';
import { useItem } from '$lib/hooks/use-item';
import { useCharacter } from '$lib/hooks/use-character';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';
import { EntityIdUtils } from '$lib/utils/entity-id';
import searchTargetAndSetPath from './search-target';
import executeGoAction from './actions/execute-go';
import executeInteractAction from './actions/execute-interact';
import executeFulfillAction from './actions/execute-fulfill';
import executeIdleAction from './actions/execute-idle';
import checkActionCompletion from './completion/check-completion';
import transitionToNextAction from './completion/transition';
import selectNewBehavior from './selection/select-behavior';

/**
 * 캐릭터의 행동을 tick마다 처리
 */
export function tickBehavior(entity: WorldCharacterEntity, tick: number): void {
	const { getNeedBehaviorAction, getConditionBehaviorAction } = useBehavior();

	// 현재 행동 액션이 없으면 새로운 행동 선택
	if (!entity.currentBehaviorTargetId) {
		selectNewBehavior(entity, tick);
		return;
	}

	// 현재 행동 액션 가져오기
	const { type } = BehaviorIdUtils.parse(entity.currentBehaviorTargetId);

	const behaviorActionId = BehaviorIdUtils.behaviorActionId(entity.currentBehaviorTargetId);
	const plainAction =
		type === 'need'
			? getNeedBehaviorAction(behaviorActionId)
			: getConditionBehaviorAction(behaviorActionId);

	if (!plainAction) {
		// 액션을 찾을 수 없으면 행동 종료
		entity.currentBehaviorTargetId = undefined;
		return;
	}

	// Plain union을 discriminated union으로 변환
	const action = BehaviorIdUtils.to(plainAction);

	// 1. 액션 시작 시점: target_selection_method에 따라 타겟 클리어 여부 결정
	if (entity.behaviorActionStartTick === tick) {
		if (action.type === 'go' || action.type === 'interact' || action.type === 'fulfill') {
			// search: 무조건 새로 탐색
			if (action.target_selection_method === 'search') {
				entity.currentTargetEntityId = undefined;
				entity.path = [];
			}
			// explicit: interaction의 엔티티 템플릿이 현재 타겟과 다르면 클리어
			else if (action.target_selection_method === 'explicit') {
				if (entity.currentTargetEntityId) {
					const shouldClearTarget = checkIfTargetMismatch.call(entity, action);
					if (shouldClearTarget) {
						entity.currentTargetEntityId = undefined;
						entity.path = [];
					}
				}
			}
			// search_or_continue: 타겟 유지
		}
	}

	// 2. Search: 타겟이 없으면 대상 탐색 및 경로 설정
	if (
		(action.type === 'go' || action.type === 'interact' || action.type === 'fulfill') &&
		entity.path.length === 0 &&
		!entity.currentTargetEntityId
	) {
		searchTargetAndSetPath(entity, action);
		return; // 경로 설정 후 다음 tick에서 실행
	}

	// 2. 행동 실행
	if (action.type === 'go') {
		executeGoAction(entity, action);
	} else if (action.type === 'interact') {
		executeInteractAction(entity, action, tick);
	} else if (action.type === 'fulfill') {
		executeFulfillAction(entity, action, tick);
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
 * explicit 타겟 선택 시 현재 타겟이 interaction의 대상과 다른지 확인
 */
function checkIfTargetMismatch(this: WorldCharacterEntity, action: BehaviorAction): boolean {
	if (!this.currentTargetEntityId) return false;

	const { getBuildingInteraction } = useBuilding();
	const { getItemInteraction } = useItem();
	const { getCharacterInteraction } = useCharacter();
	const { getEntityInstance, getEntityTemplateCandidateId } = useWorld();

	// 현재 타겟의 엔티티 타입과 템플릿 ID
	const { type: entityType, instanceId } = EntityIdUtils.parse(this.currentTargetEntityId);
	const entityInstance = getEntityInstance(entityType, instanceId);
	const targetTemplateId = entityInstance ? getEntityTemplateCandidateId(entityInstance) : undefined;

	// action의 interaction에서 대상 엔티티 타입과 템플릿 ID
	if (action.building_interaction_id) {
		const interaction = getBuildingInteraction(action.building_interaction_id);
		if (!interaction) return true; // interaction 없으면 클리어

		// 타입이 다르면 클리어
		if (entityType !== 'building') return true;

		// 특정 건물 지정 시 템플릿 ID가 다르면 클리어
		if (interaction.building_id && interaction.building_id !== targetTemplateId) {
			return true;
		}

		// 기본 인터랙션(NULL)이면 모든 건물이 대상이므로 유지
		return false;
	} else if (action.item_interaction_id) {
		const interaction = getItemInteraction(action.item_interaction_id);
		if (!interaction) return true;

		if (entityType !== 'item') return true;

		if (interaction.item_id && interaction.item_id !== targetTemplateId) {
			return true;
		}

		return false;
	} else if (action.character_interaction_id) {
		const interaction = getCharacterInteraction(action.character_interaction_id);
		if (!interaction) return true;

		if (entityType !== 'character') return true;

		if (interaction.target_character_id && interaction.target_character_id !== targetTemplateId) {
			return true;
		}

		return false;
	}

	// interaction ID가 없으면 search 모드이므로 타겟 유지
	return false;
}

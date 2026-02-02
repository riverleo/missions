import type { BehaviorAction } from '$lib/types';
import type { WorldCharacterEntityBehaviorState } from './world-character-entity-behavior-state.svelte';
import { useBehavior } from '$lib/hooks/use-behavior';
import { useWorld } from '$lib/hooks/use-world';
import searchTargetAndSetPath from './search-target';
import executeGoAction from './actions/execute-go';
import executeInteractAction from './actions/execute-interact';
import executeFulfillAction from './actions/execute-fulfill';
import executeIdleAction from './actions/execute-idle';
import checkActionCompletion from './completion/check-completion';
import transitionToNextAction from './completion/transition';

/**
 * 캐릭터의 행동을 tick마다 처리합니다.
 */
export default function tick(this: WorldCharacterEntityBehaviorState, tick: number): void {
	const { getBehaviorAction } = useBehavior();

	// 행동 선택 및 확인
	if (!this.findAndSetBehavior(tick)) return;

	// 현재 행동 액션 가져오기 (findAndSetBehavior가 값을 반환했으므로 behaviorTargetId는 확실히 존재)
	const behaviorAction = getBehaviorAction(this.behaviorTargetId!);

	if (!behaviorAction) {
		// 액션을 찾을 수 없으면 행동 종료
		this.behaviorTargetId = undefined;
		return;
	}

	// 1. 액션 시작 시점: target_selection_method에 따라 타겟 클리어 여부 결정
	if (this.behaviorTargetStartTick === tick) {
		if (
			behaviorAction.type === 'go' ||
			behaviorAction.type === 'interact' ||
			behaviorAction.type === 'fulfill'
		) {
			// search: 무조건 새로 탐색
			if (behaviorAction.target_selection_method === 'search') {
				this.targetEntityId = undefined;
				this.path = [];
			}
			// explicit: interaction의 엔티티 템플릿이 현재 타겟과 다르면 클리어
			else if (behaviorAction.target_selection_method === 'explicit') {
				if (this.targetEntityId) {
					const shouldClearTarget = checkIfTargetMismatch.call(this, behaviorAction);
					if (shouldClearTarget) {
						this.targetEntityId = undefined;
						this.path = [];
					}
				}
			}
			// search_or_continue: 타겟 유지
		}
	}

	// 2. Search: 타겟이 없으면 대상 탐색 및 경로 설정
	if (
		(behaviorAction.type === 'go' ||
			behaviorAction.type === 'interact' ||
			behaviorAction.type === 'fulfill') &&
		this.path.length === 0 &&
		!this.targetEntityId
	) {
		searchTargetAndSetPath(this.worldCharacterEntity, behaviorAction);
		return; // 경로 설정 후 다음 tick에서 실행
	}

	// 3. 행동 실행
	if (behaviorAction.type === 'go') {
		executeGoAction(this.worldCharacterEntity, behaviorAction);
	} else if (behaviorAction.type === 'interact') {
		executeInteractAction(this.worldCharacterEntity, behaviorAction, tick);
	} else if (behaviorAction.type === 'fulfill') {
		executeFulfillAction(this.worldCharacterEntity, behaviorAction, tick);
	} else if (behaviorAction.type === 'idle') {
		executeIdleAction(this.worldCharacterEntity, behaviorAction);
	}

	// 4. Do until behavior_completion_type: 완료 조건 확인
	const isCompleted = checkActionCompletion(this.worldCharacterEntity, behaviorAction, tick);
	if (isCompleted) {
		transitionToNextAction(this.worldCharacterEntity, behaviorAction, tick);
	}
}

/**
 * explicit 타겟 선택 시 현재 타겟이 interaction의 대상과 다른지 확인
 */
function checkIfTargetMismatch(
	this: WorldCharacterEntityBehaviorState,
	behaviorAction: BehaviorAction
): boolean {
	if (!this.targetEntityId) return false;

	const { getEntityInstance, getEntityTemplateCandidateId, getInteraction } = useWorld();

	// 현재 타겟의 엔티티 타입과 템플릿 ID
	const entityInstance = getEntityInstance(this.targetEntityId);
	if (!entityInstance) return false;

	const targetTemplateId = getEntityTemplateCandidateId(entityInstance);
	const entityType = entityInstance.entityType;

	// action의 interaction 가져오기
	const interaction = getInteraction(behaviorAction);
	if (!interaction) {
		// interaction이 없으면 search 모드이므로 타겟 유지
		return false;
	}

	// 타입이 다르면 클리어
	if (entityType !== interaction.interactionType) return true;

	// 특정 엔티티 지정 시 템플릿 ID 확인
	if (interaction.interactionType === 'building') {
		if (interaction.building_id && interaction.building_id !== targetTemplateId) {
			return true;
		}
	} else if (interaction.interactionType === 'item') {
		if (interaction.item_id && interaction.item_id !== targetTemplateId) {
			return true;
		}
	} else if (interaction.interactionType === 'character') {
		if (interaction.target_character_id && interaction.target_character_id !== targetTemplateId) {
			return true;
		}
	}

	// 기본 인터랙션(NULL)이면 모든 해당 타입 엔티티가 대상이므로 유지
	return false;
}

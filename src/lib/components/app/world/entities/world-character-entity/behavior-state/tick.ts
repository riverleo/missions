import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import { useBehavior } from '$lib/hooks/use-behavior';
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
export default function tick(this: WorldCharacterEntityBehavior, tick: number): void {
	const { getBehaviorAction } = useBehavior();

	// 행동 선택 및 확인
	if (!this.tickInitialize(tick)) return;

	// behaviorTargetId가 확실히 설정되었으므로 행동 액션 가져오기
	const behaviorAction = getBehaviorAction(this.behaviorTargetId)!;

	// 1. Search: 타겟이 없으면 대상 탐색 및 경로 설정
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

	// 2. 행동 실행
	if (behaviorAction.type === 'go') {
		executeGoAction(this.worldCharacterEntity, behaviorAction);
	} else if (behaviorAction.type === 'interact') {
		executeInteractAction(this.worldCharacterEntity, behaviorAction, tick);
	} else if (behaviorAction.type === 'fulfill') {
		executeFulfillAction(this.worldCharacterEntity, behaviorAction, tick);
	} else if (behaviorAction.type === 'idle') {
		executeIdleAction(this.worldCharacterEntity, behaviorAction);
	}

	// 3. Do until behavior_completion_type: 완료 조건 확인
	const isCompleted = checkActionCompletion(this.worldCharacterEntity, behaviorAction, tick);
	if (isCompleted) {
		transitionToNextAction(this.worldCharacterEntity, behaviorAction, tick);
	}
}

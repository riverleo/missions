import { useBehavior } from '$lib/hooks';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import executeOnceAction from './actions/execute-once';
import executeFulfillAction from './actions/execute-fulfill';
import executeIdleAction from './actions/execute-idle';
import checkActionCompletion from './completion/check-completion';
import transitionToNextAction from './completion/transition';

/**
 * 행동 실행 및 완료 처리
 *
 * 현재 선택된 행동을 실행하고, 완료 조건을 확인하여 다음 행동으로 전환합니다.
 *
 * @returns true: 행동 실행 중단, false: 행동 실행 완료
 */
export default function tickBehaviorAction(this: WorldCharacterEntityBehavior, tick: number): boolean {
	const { getBehaviorAction } = useBehavior();

	const behaviorAction = getBehaviorAction(this.behaviorTargetId)!;

	// 1. 행동 실행
	if (behaviorAction.type === 'once') {
		executeOnceAction(this.worldCharacterEntity, behaviorAction, tick);
	} else if (behaviorAction.type === 'fulfill') {
		executeFulfillAction(this.worldCharacterEntity, behaviorAction, tick);
	} else if (behaviorAction.type === 'idle') {
		executeIdleAction(this.worldCharacterEntity, behaviorAction);
	}

	// 2. Do until behavior_completion_type: 완료 조건 확인
	const isCompleted = checkActionCompletion(this.worldCharacterEntity, behaviorAction, tick);
	if (isCompleted) {
		transitionToNextAction(this.worldCharacterEntity, behaviorAction, tick);
	}

	return false;
}

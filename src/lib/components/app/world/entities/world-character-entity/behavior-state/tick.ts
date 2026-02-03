import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import { useBehavior } from '$lib/hooks/use-behavior';
import executeOnceAction from './actions/execute-once';
import executeFulfillAction from './actions/execute-fulfill';
import executeIdleAction from './actions/execute-idle';
import checkActionCompletion from './completion/check-completion';
import transitionToNextAction from './completion/transition';

/**
 * 캐릭터의 행동을 tick마다 처리합니다.
 */
export default function tick(this: WorldCharacterEntityBehavior, tick: number): void {
	const { getBehaviorAction } = useBehavior();

	if (!this.tickInitialize(tick)) return;
	if (!this.tickFindAndGoToTargetEntity(tick)) return;

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
}

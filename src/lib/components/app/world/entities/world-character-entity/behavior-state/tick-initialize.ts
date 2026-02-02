import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import { useBehavior } from '$lib/hooks/use-behavior';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';

/**
 * 새로운 행동을 선택 (우선순위 기반)
 */
export default function tickInitialize(this: WorldCharacterEntityBehavior, tick: number): boolean {
	const { getAllUsableBehaviors, getRootBehaviorAction } = useBehavior();

	// 이미 행동이 설정되어 있으면 초기화 완료
	if (this.behaviorTargetId) return true;

	// 1. 사용 가능한 행동 찾기
	this.behaviors = getAllUsableBehaviors(this);

	// 후보가 없으면 종료
	if (this.behaviors.length === 0) return false;

	// 2. 가장 높은 우선순위의 behavior 선택
	const behavior = this.behaviors[0]!;

	// 3. root action 찾기
	const rootBehaviorAction = getRootBehaviorAction(behavior);

	// root action이 없으면 종료
	if (!rootBehaviorAction) return false;

	// 4. currentBehaviorId 설정 및 시작 tick 기록
	this.behaviorTargetId = BehaviorIdUtils.create(behavior, rootBehaviorAction);
	this.behaviorTargetStartTick = tick;

	return true;
}

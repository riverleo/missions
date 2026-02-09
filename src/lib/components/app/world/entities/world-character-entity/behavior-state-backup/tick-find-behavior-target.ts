import { useBehavior } from '$lib/hooks';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';

/**
 * 행동 타겟 찾기
 *
 * behaviorTargetId가 없는 경우 우선순위가 가장 높은 행동을 선택합니다.
 * 모든 상태를 초기화하고(clear) 새로운 behaviorTargetId를 설정합니다.
 *
 * @returns true: 행동 실행 중단 (행동 없음), false: 행동 실행 계속 진행
 */
export default function tickFindBehaviorTarget(
	this: WorldCharacterEntityBehavior,
	tick: number
): boolean {
	const { getAllBehaviorsByPriority, getRootBehaviorAction } = useBehavior();

	if (this.behaviorTargetId) return false;

	this.clear();

	// Type assertion needed because this is backup code with old interface
	this.behaviors = getAllBehaviorsByPriority(this as any);
	const behaviorAction = getRootBehaviorAction(this.behaviors[0]);

	if (!behaviorAction) return true;

	this.behaviorTargetId = BehaviorIdUtils.create(behaviorAction);
	this.behaviorTargetStartTick = tick;

	return false;
}

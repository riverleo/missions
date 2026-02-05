import { useBehavior } from '$lib/hooks';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';

/**
 * 행동 초기화 및 선택
 *
 * 우선순위가 가장 높은 행동을 선택하여 behaviorTargetId를 설정하고,
 * 타겟 엔티티를 초기화합니다.
 *
 * @returns true: 행동 실행 중단, false: 행동 실행 계속 진행
 */
export default function tickInitialize(this: WorldCharacterEntityBehavior, tick: number): boolean {
	const { getAllBehaviorsByPriority, getRootBehaviorAction } = useBehavior();

	if (this.behaviorTargetId) return false;

	this.behaviors = getAllBehaviorsByPriority(this);
	const behaviorAction = getRootBehaviorAction(this.behaviors[0]);

	if (!behaviorAction) return true;

	this.behaviorTargetId = BehaviorIdUtils.create(behaviorAction);
	this.behaviorTargetStartTick = tick;

	this.clearTargetEntity();

	return false;
}

import { useBehavior } from '$lib/hooks';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

/**
 * IDLE 행동 처리
 *
 * idle 행동인 경우 대기하고, idle이 아니면 다음 tick 메서드로 진행합니다.
 *
 * @returns true: idle 행동 (행동 실행 중단), false: idle이 아님 (다음 tick 메서드로 진행)
 */
export default function tickIdle(this: WorldCharacterEntityBehavior, tick: number): boolean {
	const { getBehaviorAction } = useBehavior();

	const behaviorAction = getBehaviorAction(this.behaviorTargetId);
	if (!behaviorAction) return false;

	// idle 행동이 아니면 다음 메서드로 진행
	if (behaviorAction.type !== 'idle') return false;

	// idle 행동: 대기 (특별한 동작 없음)
	// 완료 조건은 tickCompletion에서 체크 (idle_duration_ticks)
	return true;
}

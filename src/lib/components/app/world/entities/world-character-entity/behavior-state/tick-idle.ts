import { useBehavior } from '$lib/hooks';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

/**
 * IDLE 행동 처리
 *
 * idle 행동의 대기 시간(idle_duration_ticks)을 체크합니다.
 * 완료되지 않았으면 return true (대기), 완료되면 return false (다음 행동으로 전환)
 *
 * @returns true: 대기 중, false: 완료 또는 idle이 아님
 */
export default function tickIdle(this: WorldCharacterEntityBehavior, tick: number): boolean {
	const { getBehaviorAction } = useBehavior();

	const behaviorAction = getBehaviorAction(this.behaviorTargetId);
	if (!behaviorAction) return false;

	// idle 행동이 아니면 다음 메서드로 진행
	if (behaviorAction.type !== 'idle') return false;

	// idle_duration_ticks 체크
	const elapsed = tick - (this.behaviorTargetStartTick ?? 0);
	if (elapsed < behaviorAction.idle_duration_ticks) {
		return true; // 아직 대기 중
	}

	// idle 완료, tickCompletion에서 다음 행동 액션으로 전환
	return false;
}

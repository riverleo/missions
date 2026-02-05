import { useBehavior } from '$lib/hooks';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

/**
 * 시스템 행동 후처리 (아이템 제거)
 *
 * 사용 인터렉션이 완료된 경우 heldItems에서 제거합니다.
 *
 * @returns true: 행동 실행 중단, false: 행동 실행 계속 진행
 */
export default function tickActionSystemPost(
	this: WorldCharacterEntityBehavior,
	tick: number
): boolean {
	const { getBehaviorAction } = useBehavior();

	const behaviorAction = getBehaviorAction(this.behaviorTargetId);
	if (!behaviorAction) return false;

	// TODO: 아이템 제거 로직 구현
	// - 사용 인터렉션이 완료되었는지 확인
	// - 완료되었으면 heldItems에서 제거

	return false;
}

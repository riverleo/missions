import type { BehaviorAction } from '$lib/types';
import type { WorldCharacterEntity } from '../../world-character-entity.svelte';

/**
 * IDLE 행동 실행 (대기)
 */
export default function executeIdleAction(entity: WorldCharacterEntity, action: BehaviorAction): void {
	// 대기는 특별히 할 일이 없음
	// 완료 조건만 체크 (idle_duration_ticks)
}

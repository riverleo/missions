import type { BehaviorAction } from '$lib/types';
import type { WorldCharacterEntity } from '../../world-character-entity.svelte';

/**
 * GO 행동 실행 (이동)
 */
export default function executeGoAction(
	worldCharacterEntity: WorldCharacterEntity,
	behaviorAction: BehaviorAction
): void {
	// path를 따라 이동하는 로직은 updateMove에서 처리
	// 여기서는 특별히 할 일이 없음 (완료 조건만 체크)
}

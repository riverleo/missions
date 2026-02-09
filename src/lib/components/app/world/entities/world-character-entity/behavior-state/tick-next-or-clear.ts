import { useBehavior } from '$lib/hooks';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

/**
 * # 다음 행동 액션 전환 또는 종료
 *
 * 현재 행동 액션이 완료되었을 때 다음 행동 액션으로 전환하거나,
 * 다음 액션이 없으면 행동을 종료합니다.
 * 완료 여부는 각 tick 메서드에서 판단하며, 이 메서드는 전환/종료만 수행합니다.
 *
 * @param tick - 현재 게임 틱 번호
 *
 * ## 명세
 * - [x] 현재 행동 타깃이 없으면 초기화하고 로직을 종료한다.
 * - [x] 현재 행동 액션을 찾을 수 없으면 에러가 발생한다.
 * - [x] 다음 행동 액션이 있으면 모든 상태를 초기화하고 다음 액션으로 전환한다.
 * - [x] 다음 행동 액션이 없으면 모든 상태를 초기화하여 행동을 종료한다.
 */
export default function tickNextOrClear(this: WorldCharacterEntityBehavior, tick: number) {
	const { getBehaviorAction, getNextBehaviorAction } = useBehavior();

	// 1. 현재 행동 타깃이 없으면 초기화하고 종료
	if (!this.behaviorTargetId) {
		return this.clear();
	}

	// 2. 현재 행동 액션 조회 (없으면 에러 발생)
	const behaviorAction = getBehaviorAction(this.behaviorTargetId);

	// 3. 다음 행동 액션 조회
	const nextBehaviorAction = getNextBehaviorAction(behaviorAction);

	if (nextBehaviorAction) {
		// 4. 다음 행동 액션이 있으면 모든 상태 초기화 후 전환
		this.clear();
		this.setBehaviorTarget(BehaviorIdUtils.create(nextBehaviorAction), tick);
	} else {
		// 5. 다음 행동 액션이 없으면 모든 상태 초기화 (행동 종료)
		this.clear();
	}
}

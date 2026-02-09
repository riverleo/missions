import { useBehavior } from '$lib/hooks';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

/**
 * # 행동 타겟 찾기
 *
 * 캐릭터가 현재 수행할 행동이 없을 때, 우선순위가 가장 높은 행동을 선택하여
 * behaviorTargetId를 할당합니다. 매 틱마다 호출되며, 행동의 시작점 역할을 합니다.
 *
 * @param tick - 현재 게임 틱 번호
 * @returns {boolean} true = 중단 후 처음, false = 계속 진행
 *
 * ## 명세
 * - [x] 우선 순위에 따라 정렬된 행동 목록은 매 틱마다 갱신된다.
 * - 현재 행동 타깃이 있는 경우
 *    - [x] 아무것도 하지 않고 계속 진행한다.
 * - 현재 행동 타깃이 없는 경우
 *    - [x] 모든 상태를 초기화(clear)한다.
 *    - [x] 행동 목록의 첫번째를 새로운 행동 타깃으로 설정한다.
 *    - [x] 루트 액션이 설정될 때 behaviorTargetStartTick을 현재 틱(useCurrent().getTick())으로 설정한다.
 *    - [x] 새로 지정할 행동에 루트 액션이 없는 경우 에러가 발생한다.
 *    - [x] 행동 타깃이 지정되었다면 다음 단계로 진행한다.
 * - [x] 초기화(clear())는 행동 타깃이 없을 때만 호출된다.
 * - [x] 행동 타깃을 찾을 수 없을 경우 중단한다.
 */
export default function tickFindBehaviorTarget(
	this: WorldCharacterEntityBehavior,
	tick: number
): boolean {
	const { getAllBehaviorsByPriority, getRootBehaviorAction } = useBehavior();

	// 1. 이미 behaviorTargetId가 있으면 아무것도 하지 않음
	if (this.behaviorTargetId) return false;

	// 2. 모든 상태 초기화
	this.clear();

	// 3. 우선순위 정렬된 행동 목록 가져오기
	this.behaviors = getAllBehaviorsByPriority(this);

	// 4. 첫 번째 행동의 root action 가져오기
	const behaviorAction = getRootBehaviorAction(this.behaviors[0]);

	// 5. root action이 없으면 에러 발생
	if (!behaviorAction) {
		throw new Error(
			`No root action found for behavior: ${this.behaviors[0]?.id ?? 'unknown'}`
		);
	}

	// 6. behaviorTargetId 설정
	this.behaviorTargetId = BehaviorIdUtils.create(behaviorAction);
	this.behaviorTargetStartTick = tick;

	return false;
}

import { useBehavior } from '$lib/hooks';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

/**
 * # 행동 타겟 찾기
 *
 * 캐릭터가 현재 수행하고 있는 행동이 없을 때, 우선순위가 가장 높은 행동 대상을 선택합니다.
 * 매 틱마다 호출되며, 행동의 시작점 역할을 합니다.
 *
 * @param tick - 현재 게임 틱 번호
 * @returns {boolean} true = 중단 후 처음, false = 계속 진행
 *
 * ## 명세
 * - [x] 행동 대상 목록이 우선 순위에 따라 틱마다 갱신된다.
 * - 진행 중인 행동 대상이 있는 경우
 *    - [x] 아무것도 하지 않고 계속 진행한다.
 * - 진행 중인 행동 대상이 없는 경우
 *    - [x] 우선 순위에 의해 정렬된 행동 대상 목록의 첫번째 행동 대상이 선택된다.
 *    - [x] 행동 대상 목록이 비어있는 경우, 중단 후 처음으로 돌아간다.
 *    - [x] 행동 대상이 선택될 때 전달된 틱을 시작 틱으로 설정한다.
 */
export default function tickFindBehaviorTarget(
	this: WorldCharacterEntityBehavior,
	tick: number
): boolean {
	const { getAllBehaviorsByPriority, getRootBehaviorAction } = useBehavior();

	// 1. 이미 behaviorTargetId가 있으면 아무것도 하지 않음
	if (this.behaviorTargetId) return false;

	// 2. 우선순위 정렬된 행동 대상 목록 가져오기
	const behaviors = getAllBehaviorsByPriority(this);
	this.behaviorIds = behaviors.map((behavior) => behavior.id);

	// 3. 행동을 찾을 수 없으면 중단 후 처음으로
	const firstBehavior = behaviors[0];
	if (!firstBehavior) {
		return true;
	}

	// 4. 첫 번째 행동의 root action 가져오기 (없으면 에러 발생)
	const behaviorAction = getRootBehaviorAction(firstBehavior);

	// 5. behaviorTargetId 설정
	this.setBehaviorTarget(BehaviorIdUtils.create(behaviorAction), tick);

	return false;
}

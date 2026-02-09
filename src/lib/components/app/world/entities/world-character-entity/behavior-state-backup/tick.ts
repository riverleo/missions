import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

/**
 * 캐릭터의 행동을 tick마다 처리합니다.
 *
 * 6단계 플로우:
 * 1. tickFindBehaviorTarget - 행동 타겟 찾기 (behaviorTargetId 할당)
 * 2. tickWaitIfIdle - idle 타입인 경우 대기 처리
 * 3. tickFindAndGo - 엔티티 타겟 찾기 및 이동 (targetEntityId 할당)
 * 4. tickActionIfSystemItemPick - 시스템 아이템 줍기인 경우 실행
 * 5. tickActionIfOnceItemUse - once 타입 아이템 사용인 경우 실행 (interactionTargetId 할당 및 아이템 제거)
 * 6. tickNextOrClear - 다음 행동 액션 전환 또는 행동 종료 (항상 실행)
 */
export default function tick(this: WorldCharacterEntityBehavior, tick: number): void {
	if (this.tickFindBehaviorTarget(tick)) return;
	if (this.tickWaitIfIdle(tick)) return;
	if (this.tickFindAndGo(tick)) return;
	if (this.tickActionIfSystemItemPick(tick)) return;
	if (this.tickActionIfOnceItemUse(tick)) return;
	this.tickNextOrClear(tick);
}

import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

/**
 * 캐릭터의 행동을 tick마다 처리합니다.
 *
 * 7단계 플로우:
 * 1. tickInitialize - 행동 초기화
 * 2. tickIdle - idle 처리
 * 3. tickFindAndGo - 타겟 찾기/이동
 * 4. tickActionSystemPre - 시스템 행동 전처리 (아이템 줍기)
 * 5. tickActionFulfillItemUse - 아이템 사용 인터렉션
 * 6. tickActionSystemPost - 시스템 행동 후처리 (아이템 제거)
 * 7. tickCompletion - 완료 체크 및 전환 (항상 실행)
 */
export default function tick(this: WorldCharacterEntityBehavior, tick: number): void {
	if (this.tickInitialize(tick)) return;
	if (this.tickIdle(tick)) return;
	if (this.tickFindAndGo(tick)) return;
	if (this.tickActionSystemPre(tick)) return;
	if (this.tickActionFulfillItemUse(tick)) return;
	if (this.tickActionSystemPost(tick)) return;
	this.tickCompletion(tick);
}

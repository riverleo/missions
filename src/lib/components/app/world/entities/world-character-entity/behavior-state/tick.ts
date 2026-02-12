import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

/**
 * 캐릭터의 행동을 tick마다 처리합니다.
 *
 * 플로우:
 * 1. tickFindBehaviorTarget: 행동 선정
 * 2. tickFindTargetEntityAndGo: 타겟 엔티티 찾기 & 이동
 * 3. tickEnqueueInteractionQueue: 인터렉션 큐 구성
 * 4. tickDequeueInteraction: 인터렉션 실행
 * 5. tickNextOrClear: 다음 행동으로 전환 또는 종료
 */
export default function tick(this: WorldCharacterEntityBehavior, tick: number): void {
	if (this.tickFindBehaviorTarget(tick)) return; // 1. 행동 선정
	if (this.tickFindTargetEntityAndGo(tick)) return; // 2. 타겟 엔티티 찾기 & 이동
	if (this.tickEnqueueInteractionQueue(tick)) return; // 3. 인터렉션 큐 구성
	if (this.tickDequeueInteraction(tick)) return; // 4. 인터렉션 실행
	this.tickNextOrClear(tick);
}

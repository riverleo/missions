import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

/**
 * 캐릭터의 행동을 tick마다 처리합니다.
 *
 * TODO: 단계별 플로우 재구성 필요
 */
export default function tick(this: WorldCharacterEntityBehavior, tick: number): void {
	if (this.tickFindBehaviorTarget(tick)) return;
	// TODO: 나머지 단계 추가 예정
	this.tickNextOrClear(tick);
}

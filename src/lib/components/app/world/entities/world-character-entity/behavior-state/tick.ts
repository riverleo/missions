import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

/**
 * 캐릭터의 행동을 tick마다 처리합니다.
 */
export default function tick(this: WorldCharacterEntityBehavior, tick: number): void {
	if (this.tickInitialize(tick)) return;
	if (this.tickFindAndGo(tick)) return;
	if (this.tickBehaviorAction(tick)) return;
}

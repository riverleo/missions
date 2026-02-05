import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type { BeforeUpdateEvent } from '../../../context';

/**
 * 캐릭터의 상태를 매 프레임마다 업데이트합니다.
 */
export default function update(this: WorldCharacterEntityBehavior, event: BeforeUpdateEvent): void {
	this.updateDirection();
	this.updateMove(event);
}

import type { WorldItemEntity } from './world-item-entity.svelte';

export function decreaseDurabilityTicks(entity: WorldItemEntity): void {
	// 내구도 감소
	if (entity.durabilityTicks !== undefined) {
		entity.durabilityTicks = Math.max(0, entity.durabilityTicks - 1);
	}
}

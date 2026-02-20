import { useBehavior } from '$lib/hooks';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

export default function tickActionOnceItemUse(
	this: WorldCharacterEntityBehavior,
	tick: number
): boolean {
	void tick;

	if (
		this.interactionQueue.status !== 'action-ready' &&
		this.interactionQueue.status !== 'action-running'
	) {
		return false;
	}

	const { isInteractionTargetType } = useBehavior();

	if (!isInteractionTargetType(this.interactionQueue.currentInteractionTargetId, 'item_use')) {
		return false;
	}

	return false;
}

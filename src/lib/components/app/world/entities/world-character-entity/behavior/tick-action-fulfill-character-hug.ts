import { useBehavior } from '$lib/hooks';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

export default function tickActionFulfillCharacterHug(
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

	if (!isInteractionTargetType(this.interactionQueue.currentInteractionTargetId, 'character_hug')) {
		return false;
	}

	return false;
}

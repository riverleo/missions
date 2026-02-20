import { useBehavior } from '$lib/hooks';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

export default function tickActionOnceBuildingDemolish(
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

	if (
		!isInteractionTargetType(this.interactionQueue.currentInteractionTargetId, 'building_demolish')
	) {
		return false;
	}

	return false;
}

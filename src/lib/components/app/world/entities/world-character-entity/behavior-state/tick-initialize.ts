import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import { useBehavior } from '$lib/hooks/use-behavior';
import { useWorld } from '$lib/hooks/use-world';
import { BehaviorIdUtils } from '$lib/utils/behavior-id';

/**
 * 새로운 행동을 선택 (우선순위 기반)
 */
export default function tickInitialize(this: WorldCharacterEntityBehavior, tick: number): boolean {
	const { getEntitySourceId } = useWorld();
	const { getAllUsableBehaviors, getRootBehaviorAction } = useBehavior();

	if (this.behaviorTargetId) return true;

	this.behaviors = getAllUsableBehaviors(this);
	const rootBehaviorAction = getRootBehaviorAction(this.behaviors[0]);

	if (!rootBehaviorAction) return false;

	this.behaviorTargetId = BehaviorIdUtils.create(rootBehaviorAction);
	this.behaviorTargetStartTick = tick;

	if (
		rootBehaviorAction.type === 'idle' ||
		rootBehaviorAction.target_selection_method === 'search'
	) {
		this.clearTargetEntity();
	} else if (rootBehaviorAction.target_selection_method === 'explicit') {
		if (this.targetEntityId) {
			const entitySourceId = getEntitySourceId(this.targetEntityId);
			const actionEntitySourceId = getEntitySourceId(rootBehaviorAction);

			if (entitySourceId !== actionEntitySourceId) {
				this.clearTargetEntity();
			}
		}
	}

	return true;
}

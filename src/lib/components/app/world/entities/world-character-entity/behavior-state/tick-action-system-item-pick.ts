import { DURATION_ZERO_FALLBACK_TICKS, TARGET_ARRIVAL_DISTANCE } from '$lib/constants';
import { useInteraction, useWorld } from '$lib/hooks';
import type { InteractionAction, InteractionTargetId, WorldItemId } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { InteractionIdUtils } from '$lib/utils/interaction-id';
import { vectorUtils } from '$lib/utils/vector';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

/**
 * item_pick 시스템 상호작용 액션 tick
 */
export default function tickActionSystemItemPick(
	this: WorldCharacterEntityBehavior,
	tick: number
): boolean {
	if (
		this.interactionQueue.status !== 'action-ready' &&
		this.interactionQueue.status !== 'action-running'
	) {
		return false;
	}

	const currentInteractionTargetId = this.interactionQueue.currentInteractionTargetId;
	if (!currentInteractionTargetId) return false;

	const { getInteraction } = useInteraction();
	const { interactionId } = InteractionIdUtils.parse(currentInteractionTargetId);
	const interaction = getInteraction(interactionId);
	if (interaction.system_interaction_type !== 'item_pick') return false;

	if (this.interactionQueue.status === 'action-ready') {
		if (!canStartSystemItemPick(this)) return false;
		this.interactionQueue.currentInteractionTargetRunningAtTick = tick;
		this.interactionQueue.status = 'action-running';
		return false;
	}

	const currentInteractionAction = getCurrentInteractionAction(this, currentInteractionTargetId);

	if (this.interactionQueue.currentInteractionTargetRunningAtTick === undefined) {
		this.interactionQueue.currentInteractionTargetRunningAtTick = tick;
	}

	const startedAtTick = this.interactionQueue.currentInteractionTargetRunningAtTick;
	if (startedAtTick === undefined) return false;

	const elapsed = tick - startedAtTick;
	const completed =
		currentInteractionAction.duration_ticks > 0
			? elapsed >= currentInteractionAction.duration_ticks
			: elapsed >= DURATION_ZERO_FALLBACK_TICKS;
	if (!completed) return false;

	applyCompletedSystemItemPick(this);
	this.interactionQueue.status = 'action-completed';
	return false;
}

export function canStartSystemItemPick(behavior: WorldCharacterEntityBehavior): boolean {
	if (!behavior.targetEntityId || EntityIdUtils.not('item', behavior.targetEntityId)) {
		return false;
	}

	if (behavior.path.length === 0) {
		return true;
	}

	const targetEntity = behavior.worldCharacterEntity.worldContext.entities[behavior.targetEntityId];
	if (!targetEntity) {
		return false;
	}

	const distance = vectorUtils.getDistance(behavior.worldCharacterEntity, targetEntity);
	return distance < TARGET_ARRIVAL_DISTANCE;
}

/**
 * item_pick 액션 완료 시점의 영속/런타임 상태를 동기화합니다.
 */
export function applyCompletedSystemItemPick(behavior: WorldCharacterEntityBehavior): void {
	if (!behavior.targetEntityId || EntityIdUtils.not('item', behavior.targetEntityId)) {
		return;
	}

	const worldItemId = EntityIdUtils.instanceId<WorldItemId>(behavior.targetEntityId);
	const { getOrUndefinedWorldItem, updateWorldItem } = useWorld();
	const worldItem = getOrUndefinedWorldItem(worldItemId);
	if (!worldItem) return;

	if (
		worldItem.world_character_id &&
		worldItem.world_character_id !== behavior.worldCharacterEntity.instanceId
	) {
		return;
	}

	updateWorldItem(worldItemId, {
		world_character_id: behavior.worldCharacterEntity.instanceId,
	});

	if (!behavior.worldCharacterEntity.heldItemIds.includes(behavior.targetEntityId)) {
		behavior.worldCharacterEntity.heldItemIds = [
			...behavior.worldCharacterEntity.heldItemIds,
			behavior.targetEntityId,
		];
	}

	const targetItemEntity = behavior.worldCharacterEntity.worldContext.entities[behavior.targetEntityId];
	if (targetItemEntity) {
		targetItemEntity.removeFromWorld();
	}
}

function getCurrentInteractionAction(
	behavior: WorldCharacterEntityBehavior,
	interactionTargetId: InteractionTargetId
): InteractionAction {
	const { getAllInteractionActions } = useInteraction();
	const { interactionActionId } = InteractionIdUtils.parse(interactionTargetId);
	const currentInteractionAction = getAllInteractionActions().find(
		(action) => action.id === interactionActionId
	);
	if (!currentInteractionAction) {
		throw new Error(`InteractionAction not found: ${interactionActionId}`);
	}
	return currentInteractionAction;
}

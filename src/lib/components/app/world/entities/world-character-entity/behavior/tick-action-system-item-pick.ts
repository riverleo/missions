import { TARGET_ARRIVAL_DISTANCE } from '$lib/constants';
import { useInteraction, useWorld } from '$lib/hooks';
import type { InteractionAction, InteractionTargetId, WorldItemId } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { InteractionIdUtils } from '$lib/utils/interaction-id';
import { vectorUtils } from '$lib/utils/vector';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

const ITEM_PICK_START_DISTANCE = Math.max(TARGET_ARRIVAL_DISTANCE, 10);

/**
 * # item_pick 시스템 상호작용 실행 tick 함수
 *
 * `action-ready` 또는 `action-running` 상태에서 `item_pick` 시스템 상호작용을 진행합니다.
 * 이 함수는 실행 시작 시점/완료 판정/완료 부작용 반영까지 담당합니다.
 *
 * @param tick - 현재 틱
 * @returns {boolean} true = 중단 후 처음, false = 계속 진행
 *
 * ## 명세
 * - [x] 상호작용 큐 상태가 `action-ready` 또는 `action-running`이 아니면 아무 작업도 하지 않는다.
 * - [x] 상호작용 대상이 없을 경우 아무 작업도 하지 않는다.
 * - [x] 상호작용이 `item_pick`이 아닐 경우 아무 작업도 하지 않는다.
 * - [x] `action-ready` 상태에서 시작 조건(타깃 5px 이내 근접)이 충족되지 않으면 실행을 시작하지 않는다.
 * - [x] `action-ready` 상태에서 시작 조건이 충족되면 `currentInteractionTargetRunningAtTick`를 기록하고 `action-running`으로 전환한다.
 * - [x] `action-running` 상태에서 현재 상호작용 액션을 조회한다.
 * - [x] 실행 시작 틱이 비어 있으면 현재 틱으로 보정한다.
 * - [x] `duration_ticks` 경과로 완료를 판정한다.
 * - [x] `duration_ticks <= 0`이면 런타임에서 최소 1틱으로 보정해 완료를 판정한다.
 * - [x] 완료 시 `applyCompletedSystemItemPick`을 호출하고 큐 상태를 `action-completed`로 전환한다.
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

	const { currentInteractionTargetId } = this.interactionQueue;
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

	const { currentInteractionTargetRunningAtTick } = this.interactionQueue;
	if (currentInteractionTargetRunningAtTick === undefined) return false;

	const elapsed = tick - currentInteractionTargetRunningAtTick;
	const completed = isCompleted(currentInteractionAction, elapsed);
	if (!completed) return false;

	applyCompletedSystemItemPick(this);
	this.interactionQueue.status = 'action-completed';
	return false;
}

export function canStartSystemItemPick(behavior: WorldCharacterEntityBehavior): boolean {
	if (!behavior.targetEntityId || EntityIdUtils.not('item', behavior.targetEntityId)) {
		return false;
	}

	const targetEntity = behavior.worldCharacterEntity.worldContext.entities[behavior.targetEntityId];
	if (!targetEntity) {
		return false;
	}

	const distance = vectorUtils.getDistance(behavior.worldCharacterEntity, targetEntity);
	return distance <= ITEM_PICK_START_DISTANCE;
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

	const targetItemEntity =
		behavior.worldCharacterEntity.worldContext.entities[behavior.targetEntityId];
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

function isCompleted(currentInteractionAction: InteractionAction, elapsed: number): boolean {
	const normalizedDurationTicks = normalizeDurationTicks(currentInteractionAction.duration_ticks);
	return elapsed >= normalizedDurationTicks;
}

function normalizeDurationTicks(durationTicks: number): number {
	return durationTicks > 0 ? durationTicks : 1;
}

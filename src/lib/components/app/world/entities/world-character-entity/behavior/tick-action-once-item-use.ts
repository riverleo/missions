import { useBehavior, useCharacter, useFulfillment, useInteraction } from '$lib/hooks';
import type { InteractionAction, InteractionTargetId } from '$lib/types';
import { InteractionIdUtils } from '$lib/utils/interaction-id';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

/**
 * # 아이템 사용 단발 상호작용 액션 실행
 *
 * 상호작용 큐가 액션 준비(`action-ready`) 또는 액션 실행 중(`action-running`)일 때
 * 아이템 사용 단발 액션(`item_use`)을 처리한다.
 * 이 함수는 실행 대상 판정, 실행 시작, 완료 판정, 완료 후 큐 상태 전이를 담당한다.
 *
 * @param tick - 현재 틱
 * @returns {boolean} true = 중단 후 처음부터 다시 실행, false = 현재 틱 흐름 계속 진행
 *
 * ## 명세
 * - [x] 상호작용 큐가 액션 준비/액션 실행 중 상태가 아니면 아무 작업도 하지 않는다.
 * - [x] 현재 상호작용 대상이 없으면 아무 작업도 하지 않는다.
 * - [x] 현재 상호작용 대상이 `item_use` 타입이 아니면 아무 작업도 하지 않는다.
 * - [x] 액션 준비 상태에서 캐릭터가 현재 대상 엔티티를 들고 있으면 액션 실행 중으로 전환한다.
 * - [x] 액션 실행 중 상태에서 상호작용 액션의 `duration_ticks` 경과로 완료를 판정한다.
 * - [x] 아이템 사용 충족 조건 값이 틱마다 올바르게 증가한다.
 * - [x] 욕구의 최대치를 넘겨서 증가할 수 없다.
 * - [x] 액션 실행이 완료되면 소지 아이템을 제거한다.
 */
export default function tickActionOnceItemUse(
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
	if (!currentInteractionTargetId) {
		return false;
	}

	const { isInteractionTargetType } = useBehavior();

	if (!isInteractionTargetType(currentInteractionTargetId, 'item_use')) {
		return false;
	}

	if (this.interactionQueue.status === 'action-ready') {
		if (!canStartOnceItemUse(this)) {
			return false;
		}

		this.interactionQueue.currentInteractionTargetRunningAtTick = tick;
		this.interactionQueue.status = 'action-running';
	}

	const currentInteractionAction = getCurrentInteractionAction(currentInteractionTargetId);

	if (this.interactionQueue.currentInteractionTargetRunningAtTick === undefined) {
		this.interactionQueue.currentInteractionTargetRunningAtTick = tick;
	}

	applyNeedFulfillmentPerTick(this, currentInteractionAction);

	const { currentInteractionTargetRunningAtTick } = this.interactionQueue;
	if (currentInteractionTargetRunningAtTick === undefined) {
		return false;
	}

	const elapsed = tick - currentInteractionTargetRunningAtTick;
	if (!isCompleted(currentInteractionAction, elapsed)) {
		return false;
	}

	applyCompletedOnceItemUse(this);
	this.interactionQueue.status = 'action-completed';
	return false;
}

function canStartOnceItemUse(behavior: WorldCharacterEntityBehavior): boolean {
	const { targetEntityId } = behavior;
	if (!targetEntityId) {
		return false;
	}

	return behavior.worldCharacterEntity.heldItemIds.includes(targetEntityId);
}

function getCurrentInteractionAction(interactionTargetId: InteractionTargetId): InteractionAction {
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

function applyNeedFulfillmentPerTick(
	behavior: WorldCharacterEntityBehavior,
	currentInteractionAction: InteractionAction
): void {
	if (currentInteractionAction.entitySourceType !== 'item') {
		return;
	}

	const { getAllNeedFulfillments } = useFulfillment();
	const { getNeed } = useCharacter();
	const needFulfillments = getAllNeedFulfillments().filter(
		(fulfillment) =>
			fulfillment.item_interaction_id === currentInteractionAction.item_interaction_id
	);

	for (const fulfillment of needFulfillments) {
		const currentNeed = behavior.worldCharacterEntity.needs[fulfillment.need_id];
		if (!currentNeed) {
			continue;
		}

		const need = getNeed(currentNeed.need_id);
		const nextValue = currentNeed.value + fulfillment.increase_per_tick;
		currentNeed.value = Math.min(nextValue, need.max_value);
	}
}

function applyCompletedOnceItemUse(behavior: WorldCharacterEntityBehavior): void {
	const { targetEntityId } = behavior;
	if (!targetEntityId) {
		return;
	}

	behavior.worldCharacterEntity.heldItemIds = behavior.worldCharacterEntity.heldItemIds.filter(
		(heldItemId) => heldItemId !== targetEntityId
	);
}

function isCompleted(currentInteractionAction: InteractionAction, elapsed: number): boolean {
	return elapsed >= normalizeDurationTicks(currentInteractionAction.duration_ticks);
}

function normalizeDurationTicks(durationTicks: number): number {
	return durationTicks > 0 ? durationTicks : 1;
}

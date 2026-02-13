import { useInteraction } from '$lib/hooks';
import type { InteractionAction, InteractionTargetId } from '$lib/types';
import { InteractionIdUtils } from '$lib/utils/interaction-id';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

/**
 * # 상호작용 큐 dequeue tick 함수
 *
 * 이 함수는 상호작용 큐에서 "다음에 실행할 액션"만 선택합니다.
 * 실제 상호작용 실행/완료 판정은 각 tick-action-*에서 처리합니다.
 *
 * @param tick - 현재 틱 (dequeue에서는 사용하지 않음)
 * @returns false (항상 다음 단계로 진행)
 *
 * ## 명세
 * - [x] 상호작용 큐 상태가 `ready` 또는 `action-completed`가 아니면 아무 작업도 하지 않는다.
 * - [x] `ready` 상태면 첫 번째 타깃을 `currentInteractionTargetId`로 설정하고 `action-running`으로 전환한다.
 * - [x] `action-completed` 상태면 현재 타깃의 next 액션을 우선 탐색한다.
 * - [x] next 액션이 없으면 `interactionTargetIds`에서 현재 타깃의 다음 인덱스를 탐색한다.
 * - [x] 다음 타깃이 있으면 `currentInteractionTargetId`를 갱신하고 `action-running`으로 전환한다.
 * - [x] 다음 타깃이 없으면 `completed`로 전환하고 진행한다.
 */
export default function tickDequeueInteraction(
	this: WorldCharacterEntityBehavior,
	tick: number
): boolean {
	void tick;

	if (
		this.interactionQueue.status !== 'ready' &&
		this.interactionQueue.status !== 'action-completed'
	) {
		return false;
	}

	if (this.interactionQueue.status === 'ready') {
		const firstInteractionTargetId = this.interactionQueue.interactionTargetIds[0];
		if (!firstInteractionTargetId) {
			completeInteractionQueue(this);
			return false;
		}

		startInteractionTarget(this, firstInteractionTargetId);
		return false;
	}

	const currentInteractionTargetId = this.interactionQueue.currentInteractionTargetId;
	if (!currentInteractionTargetId) {
		completeInteractionQueue(this);
		return false;
	}

	const nextInteractionTargetId =
		getOrUndefinedNextInteractionTargetIdFromAction(this, currentInteractionTargetId) ??
		getOrUndefinedNextInteractionTargetIdFromQueue(this, currentInteractionTargetId);

	if (!nextInteractionTargetId) {
		completeInteractionQueue(this);
		return false;
	}

	startInteractionTarget(this, nextInteractionTargetId);
	return false;
}

function startInteractionTarget(
	behavior: WorldCharacterEntityBehavior,
	interactionTargetId: InteractionTargetId
): void {
	behavior.interactionQueue.currentInteractionTargetId = interactionTargetId;
	behavior.interactionQueue.currentInteractionTargetStartedAtTick = undefined;
	behavior.interactionQueue.status = 'action-running';
}

function completeInteractionQueue(behavior: WorldCharacterEntityBehavior): void {
	behavior.interactionQueue.status = 'completed';
}

function getOrUndefinedNextInteractionTargetIdFromAction(
	behavior: WorldCharacterEntityBehavior,
	currentInteractionTargetId: InteractionTargetId
): InteractionTargetId | undefined {
	const currentInteractionAction = getOrUndefinedInteractionActionByTargetId(
		behavior,
		currentInteractionTargetId
	);
	if (!currentInteractionAction) return undefined;

	const { getNextInteractionAction } = useInteraction();
	const nextInteractionAction = getNextInteractionAction(currentInteractionAction);
	if (!nextInteractionAction) return undefined;

	return InteractionIdUtils.create(nextInteractionAction);
}

function getOrUndefinedNextInteractionTargetIdFromQueue(
	behavior: WorldCharacterEntityBehavior,
	currentInteractionTargetId: InteractionTargetId
): InteractionTargetId | undefined {
	const currentIndex = behavior.interactionQueue.interactionTargetIds.indexOf(currentInteractionTargetId);
	if (currentIndex === -1) return undefined;

	return behavior.interactionQueue.interactionTargetIds[currentIndex + 1];
}

function getOrUndefinedInteractionActionByTargetId(
	behavior: WorldCharacterEntityBehavior,
	interactionTargetId: InteractionTargetId
): InteractionAction | undefined {
	const { getAllInteractionActions } = useInteraction();
	const { interactionActionId } = InteractionIdUtils.parse(interactionTargetId);
	return getAllInteractionActions().find((action) => action.id === interactionActionId);
}

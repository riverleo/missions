import { useCharacter, useInteraction } from '$lib/hooks';
import { DURATION_ZERO_FALLBACK_TICKS } from '$lib/constants';
import type { InteractionAction, LoopType } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { InteractionIdUtils } from '$lib/utils/interaction-id';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

/**
 * # 상호작용 큐 실행 tick 함수
 *
 * interaction queue의 현재 액션을 실행하고 완료 조건을 검사합니다.
 * - `duration_ticks > 0`: 틱 경과 기반 완료
 * - `duration_ticks = 0`: 바디 애니메이션 완료 기반 완료
 * - 완료 신호를 받을 수 없는 loop 타입(`loop`, `ping-pong`)은 1틱 폴백 완료
 *
 * @param tick - 현재 틱
 * @returns false (항상 다음 단계로 진행)
 *
 * ## 명세 (초안)
 * - [x] 상호작용 큐 상태가 준비완료 또는 실행중이 아니면 다음 단계로 진행한다.
 * - [x] 상호작용 큐 상태가 준비완료면 다음 상호작용 대상을 꺼내 실행중으로 전환한다.
 * - [x] 실행중 상태에서 현재 실행 중인 상호작용 대상이 없으면 큐를 완료로 전환한다.
 * - [x] 현재 실행 중인 상호작용 대상으로 현재 실행 중인 상호작용 액션을 조회한다.
 * - [x] 상호작용 액션 지속 시간이 0보다 크면, 현재 실행 중인 상호작용 시작 시각(틱) 기준 경과 시간으로 완료를 판정한다.
 * - [x] 상호작용 액션 지속 시간이 0이고 바디 애니메이션 완료 신호를 받을 수 있는 반복 모드면, 완료 신호를 기다린다.
 * - [x] 상호작용 액션 지속 시간이 0이고 바디 애니메이션 완료 신호를 받을 수 없는 반복 모드면, 1틱 폴백으로 완료 처리한다.
 * - [x] 현재 상호작용 액션 완료 시 다음 상호작용 대상을 꺼내고, 더 없으면 큐를 완료로 전환한다.
 * - [x] 상호작용 액션 전환 또는 큐 완료 시 바디 애니메이션 완료 상태를 초기화한다.
 */
export default function tickDequeueInteraction(
	this: WorldCharacterEntityBehavior,
	tick: number
): boolean {
	if (this.interactionQueue.status !== 'ready' && this.interactionQueue.status !== 'running') {
		return false;
	}

	if (this.interactionQueue.status === 'ready') {
		popNextInteractionTargetId.call(this, tick);
		return false;
	}

	if (!this.interactionQueue.poppedInteractionTargetId) {
		this.interactionQueue.status = 'completed';
		return false;
	}

	const currentInteractionAction = getCurrentInteractionAction.call(this);
	const elapsed = tick - this.interactionQueue.poppedAtTick;

	if (currentInteractionAction.duration_ticks > 0) {
		if (elapsed < currentInteractionAction.duration_ticks) return false;
		popNextInteractionTargetId.call(this, tick);
		return false;
	}

	if (isDurationZeroCompletableByAnimation.call(this, currentInteractionAction)) {
		if (!this.isCurrentInteractionBodyAnimationCompleted()) return false;
		popNextInteractionTargetId.call(this, tick);
		return false;
	}

	if (elapsed < DURATION_ZERO_FALLBACK_TICKS) return false;

	console.warn(
		`duration_ticks=0 fallback applied for interaction action "${currentInteractionAction.id}" because body animation completion is not available.`
	);
	popNextInteractionTargetId.call(this, tick);
	return false;
}

function popNextInteractionTargetId(this: WorldCharacterEntityBehavior, tick: number): void {
	const nextInteractionTargetId = this.interactionQueue.interactionTargetIds.shift();
	this.resetCurrentInteractionBodyAnimationCompleted();

	if (!nextInteractionTargetId) {
		this.interactionQueue.poppedInteractionTargetId = undefined;
		this.interactionQueue.status = 'completed';
		return;
	}

	this.interactionQueue.poppedInteractionTargetId = nextInteractionTargetId;
	this.interactionQueue.poppedAtTick = tick;
	this.interactionQueue.status = 'running';
}

function getCurrentInteractionAction(this: WorldCharacterEntityBehavior): InteractionAction {
	const { getAllInteractionActions } = useInteraction();

	const interactionTargetId = this.interactionQueue.poppedInteractionTargetId;
	if (!interactionTargetId) {
		throw new Error('Interaction target ID is missing while queue status is running');
	}

	const { interactionActionId } = InteractionIdUtils.parse(interactionTargetId);
	const currentInteractionAction = getAllInteractionActions().find(
		(action) => action.id === interactionActionId
	);

	if (!currentInteractionAction) {
		throw new Error(`InteractionAction not found: ${interactionActionId}`);
	}

	return currentInteractionAction;
}

function isDurationZeroCompletableByAnimation(
	this: WorldCharacterEntityBehavior,
	currentInteractionAction: InteractionAction
): boolean {
	const {
		getOrUndefinedCharacter,
		getOrUndefinedCharacterBody,
		getOrUndefinedCharacterBodyStates,
	} = useCharacter();

	const bodyStateType = currentInteractionAction.character_body_state_type;
	if (!bodyStateType) return false;

	const characterId = EntityIdUtils.sourceId(this.worldCharacterEntity.id);
	const character = getOrUndefinedCharacter(characterId);
	if (!character) return false;

	const characterBody = getOrUndefinedCharacterBody(character.character_body_id);
	if (!characterBody) return false;

	const bodyStates = getOrUndefinedCharacterBodyStates(characterBody.id);
	const bodyState = bodyStates?.find((state) => state.type === bodyStateType);
	const loop = bodyState?.loop as LoopType | undefined;

	return loop === 'once' || loop === 'ping-pong-once';
}

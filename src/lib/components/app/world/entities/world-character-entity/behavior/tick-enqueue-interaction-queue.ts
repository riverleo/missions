import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import { useInteraction } from '$lib/hooks';
import { InteractionIdUtils } from '$lib/utils/interaction-id';

/**
 * # 상호작용 큐를 구성하는 tick 함수
 *
 * 핵심 상호작용 대상을 기반으로 실행할 상호작용 시퀀스를 구성하고,
 * 상호작용 대상 목록을 채웁니다.
 *
 * @param tick - 현재 틱
 * @returns false (항상 다음 단계로 진행)
 *
 * ## 명세
 * - [x] 상호작용 큐 상태가 '준비완료', '실행중' 또는 '완료'면 다음 단계로 진행한다.
 * - [x] 핵심 상호작용 대상이 없으면 상태를 '완료'로 변경하고 다음 단계로 진행한다.
 * - [x] 타깃 엔티티가 없으면 상태를 '완료'로 변경하고 다음 단계로 진행한다.
 * - [x] 핵심 상호작용 대상을 파싱하여 상호작용을 가져온다.
 * - [x] 핵심 상호작용이 '아이템 사용'인 경우 '아이템 줍기' 시스템 상호작용의 시작 액션을 먼저 추가한다.
 * - [x] 핵심 상호작용 대상을 상호작용 대상 목록에 추가한다.
 * - [x] 상태를 '준비완료'로 변경한다.
 * - [x] 항상 false를 반환하여 다음 단계로 진행한다.
 */
export default function tickEnqueueInteractionQueue(
	this: WorldCharacterEntityBehavior,
	tick: number
): boolean {
	// 상태가 '준비완료', '액션 실행중', '액션 완료' 또는 '완료'면 다음 단계로 진행
	if (
		this.interactionQueue.status === 'ready' ||
		this.interactionQueue.status === 'action-ready' ||
		this.interactionQueue.status === 'action-running' ||
		this.interactionQueue.status === 'action-completed' ||
		this.interactionQueue.status === 'completed'
	) {
		return false;
	}

	// 핵심 상호작용 대상이 없으면 상태를 '완료'로 변경하고 다음 단계로 진행
	if (!this.targetEntityId || !this.interactionQueue.coreInteractionTargetId) {
		this.interactionQueue.status = 'completed';
		return false;
	}

	const { getInteraction, getRootInteractionAction } = useInteraction();

	// 핵심 상호작용 대상을 파싱하여 상호작용 가져오기
	const { interactionId } = InteractionIdUtils.parse(this.interactionQueue.coreInteractionTargetId);
	const coreInteraction = getInteraction(interactionId);

	// 핵심 상호작용이 '아이템 사용'인 경우 '아이템 줍기' 시스템 상호작용의 시작 액션을 먼저 추가
	if (coreInteraction.once_interaction_type === 'item_use') {
		this.interactionQueue.interactionTargetIds.push(
			InteractionIdUtils.create(getRootInteractionAction(this.targetEntityId, 'item_pick'))
		);
	}

	// 핵심 상호작용 대상을 상호작용 대상 목록에 추가
	this.interactionQueue.interactionTargetIds.push(this.interactionQueue.coreInteractionTargetId);

	// 상태를 '준비완료'로 변경
	this.interactionQueue.status = 'ready';

	// 다음 단계로 진행
	return false;
}

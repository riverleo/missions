import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type { InteractionTargetId, Interaction } from '$lib/types';
import { useInteraction, useBehavior } from '$lib/hooks';
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
 * - [x] 상호작용 대상 목록이 이미 채워져 있으면 다음 단계로 진행한다.
 * - [x] 핵심 상호작용 대상이 없으면 다음 단계로 진행한다.
 * - [x] 타깃 엔티티가 없으면 다음 단계로 진행한다.
 * - [x] 핵심 상호작용 대상을 파싱하여 상호작용을 가져온다.
 * - [x] 핵심 상호작용이 아이템 사용인 경우 아이템 줍기 시스템 상호작용의 전체 액션 시퀀스를 먼저 추가한다.
 * - [x] 핵심 상호작용의 전체 액션 시퀀스를 상호작용 대상 목록에 추가한다.
 * - [x] 항상 false를 반환하여 다음 단계로 진행한다.
 */
export default function tickEnqueueInteractions(
	this: WorldCharacterEntityBehavior,
	tick: number
): boolean {
	// 이미 채워져 있으면 다음 단계로 진행
	if (this.interactionQueue.interactionTargetIds.length > 0) {
		return false;
	}

	// coreInteractionTargetId가 없으면 큐 구성 불가
	if (!this.interactionQueue.coreInteractionTargetId || !this.targetEntityId) {
		return false;
	}

	const { getInteraction, getAllInteractionActionsByInteractionId } = useInteraction();

	// 1. coreInteractionTargetId에서 Interaction 가져오기
	const { interactionId } = InteractionIdUtils.parse(this.interactionQueue.coreInteractionTargetId);
	const coreInteraction = getInteraction(interactionId);

	// 2. 인터렉션 타입에 따라 시퀀스 구성

	// 아이템 사용 인터렉션인 경우, 먼저 item_pick 시스템 인터렉션의 전체 시퀀스 추가
	if (coreInteraction.once_interaction_type === 'item_use') {
		const pickInteraction = getInteraction(this.targetEntityId, 'item_pick');
		const pickActions = getAllInteractionActionsByInteractionId(pickInteraction.id);
		this.interactionQueue.interactionTargetIds.push(
			...pickActions.map((action) => InteractionIdUtils.create(action))
		);
	}

	// 핵심 인터렉션의 전체 시퀀스 추가
	const coreActions = getAllInteractionActionsByInteractionId(interactionId);
	this.interactionQueue.interactionTargetIds.push(
		...coreActions.map((action) => InteractionIdUtils.create(action))
	);

	// 큐 구성 완료, 다음 단계로 진행
	return false;
}

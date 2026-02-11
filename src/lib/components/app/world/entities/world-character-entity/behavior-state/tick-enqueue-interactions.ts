import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type { InteractionTargetId, Interaction } from '$lib/types';
import { useInteraction, useBehavior } from '$lib/hooks';
import { InteractionIdUtils } from '$lib/utils/interaction-id';

/**
 * # 인터렉션 큐를 구성하는 tick 함수
 *
 * behaviorTargetId와 targetEntityId를 기반으로 실행할 인터렉션 시퀀스를 구성하고,
 * InteractionQueue를 생성하여 behavior에 설정합니다.
 *
 * @param tick - 현재 틱
 * @returns true: 큐 구성 성공 및 대기, false: 다음 단계로 진행
 *
 * ## 명세
 * - [ ]
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

	const { getInteraction, getAllInteractionsByEntityId, getAllInteractionActionsByInteraction } =
		useInteraction();

	// 1. coreInteractionTargetId에서 Interaction 가져오기
	const { interactionId } = InteractionIdUtils.parse(this.interactionQueue.coreInteractionTargetId);
	const coreInteraction = getInteraction(interactionId);

	/**
	 * Interaction에서 root InteractionAction을 찾아 InteractionTargetId 생성
	 */
	const getInteractionTargetId = (interaction: Interaction): InteractionTargetId | undefined => {
		const actions = getAllInteractionActionsByInteraction(interaction);
		const rootAction = actions.find((action) => action.root);
		if (rootAction) {
			return InteractionIdUtils.create(rootAction);
		}
		return undefined;
	};

	// 3. 인터렉션 타입에 따라 시퀀스 구성

	// 아이템 사용 인터렉션인 경우, 먼저 item_pick 시스템 인터렉션 추가
	if (coreInteraction.once_interaction_type === 'item_use') {
		const allInteractions = getAllInteractionsByEntityId(this.targetEntityId);
		const pickInteraction = allInteractions.find((i) => i.system_interaction_type === 'item_pick');
		if (pickInteraction) {
			const pickInteractionTargetId = getInteractionTargetId(pickInteraction);
			if (pickInteractionTargetId) {
				this.interactionQueue.interactionTargetIds.push(pickInteractionTargetId);
			}
		}
	}

	// 핵심 인터렉션 추가
	if (this.interactionQueue.coreInteractionTargetId) {
		this.interactionQueue.interactionTargetIds.push(this.interactionQueue.coreInteractionTargetId);
	}

	// 큐 구성 완료, 다음 단계로 진행
	return false;
}

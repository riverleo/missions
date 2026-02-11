import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type { InteractionQueue, InteractionTargetId, Interaction } from '$lib/types';
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
	// 이미 큐가 설정되어 있으면 다음 단계로 진행
	if (this.interactionQueue) {
		return false;
	}

	// behaviorTargetId와 targetEntityId가 없으면 큐 구성 불가
	if (!this.behaviorTargetId || !this.targetEntityId) {
		return false;
	}

	const { getBehaviorAction } = useBehavior();
	const {
		getAllInteractionsByEntityId,
		getOrUndefinedInteractionByEntityId,
		getAllInteractionActionsByInteraction,
	} = useInteraction();

	// 1. BehaviorAction에서 인터렉션 타입 가져오기
	const behaviorAction = getBehaviorAction(this.behaviorTargetId);

	// idle 타입은 인터렉션이 없음
	if (behaviorAction.type === 'idle') {
		return false;
	}

	const interactionType = behaviorAction.type;

	// 2. 타겟 엔티티의 해당 타입 인터렉션 검색
	const coreInteraction = getOrUndefinedInteractionByEntityId(this.targetEntityId, interactionType);

	if (!coreInteraction) {
		// 인터렉션이 없으면 다음 단계로 진행
		return false;
	}

	const interactionTargetIds: InteractionTargetId[] = [];

	/**
	 * Interaction에서 root InteractionAction을 찾아 InteractionTargetId 생성
	 */
	const addInteractionToQueue = (interaction: Interaction): void => {
		const actions = getAllInteractionActionsByInteraction(interaction);
		const rootAction = actions.find((action) => action.root);
		if (rootAction) {
			interactionTargetIds.push(InteractionIdUtils.create(rootAction));
		}
	};

	// 3. 인터렉션 타입에 따라 시퀀스 구성

	// 아이템 사용 인터렉션인 경우, 먼저 item_pick 시스템 인터렉션 추가
	if (coreInteraction.once_interaction_type === 'item_use') {
		const allInteractions = getAllInteractionsByEntityId(this.targetEntityId);
		const pickInteraction = allInteractions.find((i) => i.system_interaction_type === 'item_pick');
		if (pickInteraction) {
			addInteractionToQueue(pickInteraction);
		}
	}

	// 핵심 인터렉션 추가
	addInteractionToQueue(coreInteraction);

	// 4. InteractionQueue 생성 및 설정
	const interactionQueue: InteractionQueue = {
		interactionTargetIds,
		poppedInteractionTargetId: undefined,
		poppedAtTick: 0,
	};

	this.setInteractionQueue(interactionQueue);

	// 큐 구성 완료, 다음 단계로 진행
	return false;
}

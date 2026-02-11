import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type { InteractionQueue, InteractionTargetId, Interaction } from '$lib/types';
import { searchInteractions } from '$lib/hooks/use-behavior/search-interactions';
import { useInteraction } from '$lib/hooks';
import { InteractionIdUtils } from '$lib/utils/interaction-id';

/**
 * 인터렉션 큐를 구성하는 tick 함수
 *
 * behaviorTargetId와 targetEntityId를 기반으로 실행할 인터렉션 시퀀스를 구성하고,
 * InteractionQueue를 생성하여 behavior에 설정합니다.
 *
 * @param tick - 현재 틱
 * @returns true: 큐 구성 성공 및 대기, false: 다음 단계로 진행
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

	// 1. 핵심 인터렉션 검색 및 선택
	const coreInteractions = searchInteractions(
		this.behaviorTargetId,
		this.worldCharacterEntity.sourceId
	);

	if (coreInteractions.length === 0) {
		// 인터렉션이 없으면 다음 단계로 진행
		return false;
	}

	// 첫 번째 인터렉션 선택
	const coreInteraction = coreInteractions[0];
	if (!coreInteraction) {
		return false;
	}

	const { getAllInteractionActionsByInteraction } = useInteraction();
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

	// 2. 핵심 인터렉션 타입에 따라 시스템 인터렉션 추가

	// 아이템 사용 인터렉션인 경우
	if (coreInteraction.once_interaction_type === 'item_use') {
		// item_pick 시스템 인터렉션 찾기
		const pickInteraction = coreInteractions.find(
			(i) => i.system_interaction_type === 'item_pick'
		);
		if (pickInteraction) {
			addInteractionToQueue(pickInteraction);
		}
	}

	// 3. 핵심 인터렉션 추가
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

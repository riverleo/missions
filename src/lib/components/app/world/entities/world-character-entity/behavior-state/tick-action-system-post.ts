import { useBehavior, useWorld, useInteraction, useCharacter } from '$lib/hooks';
import { produce } from 'immer';
import { EntityIdUtils } from '$lib/utils/entity-id';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type { WorldItemId, Interaction } from '$lib/types';

/**
 * 시스템 행동 후처리 (아이템 제거)
 *
 * 사용 인터렉션이 완료된 경우 heldItems에서 제거합니다.
 *
 * @returns true: 행동 실행 중단, false: 행동 실행 계속 진행
 */
export default function tickActionSystemPost(
	this: WorldCharacterEntityBehavior,
	tick: number
): boolean {
	const { getBehaviorAction } = useBehavior();
	const { getInteraction, getWorldItem, worldItemStore } = useWorld();
	const { getItemInteraction } = useInteraction();
	const { getAllNeedFulfillments } = useCharacter();

	const worldCharacterEntity = this.worldCharacterEntity;
	const behaviorAction = getBehaviorAction(this.behaviorTargetId);
	if (!behaviorAction) {
		return false;
	}

	// once 타입이 아니면 skip
	if (behaviorAction.type !== 'once') {
		return false;
	}

	// 인터렉션 가져오기
	let interaction: Interaction | undefined;

	if (behaviorAction.target_selection_method === 'explicit') {
		// explicit: 명시적으로 지정된 interaction 사용
		interaction = getInteraction(behaviorAction);
	} else if (behaviorAction.target_selection_method === 'search') {
		// search: fulfillment를 통해 자동 탐색
		const fulfillments = getAllNeedFulfillments().filter(
			(f) => 'need_id' in behaviorAction && f.need_id === behaviorAction.need_id
		);

		// once_interaction_type이 있고 item으로 시작하는 interaction 찾기
		for (const fulfillment of fulfillments) {
			if (fulfillment.item_interaction_id) {
				const foundInteraction = getItemInteraction(fulfillment.item_interaction_id);
				if (foundInteraction?.once_interaction_type?.startsWith('item')) {
					interaction = foundInteraction as Interaction;
					break;
				}
			}
		}
	}

	if (!interaction) {
		throw new Error(
			`[tick-action-system-post] No interaction found for behaviorAction ${behaviorAction.id} (method: ${behaviorAction.target_selection_method})`
		);
	}

	// 아이템 인터렉션이 아니면 skip
	if (!interaction.once_interaction_type?.startsWith('item')) {
		return false;
	}

	// 인터렉션 체인이 완료되었는지 확인
	if (this.interactionTargetId) {
		return false; // 아직 진행 중
	}

	// 들고 있는 아이템 제거
	if (worldCharacterEntity.heldItemIds.length === 0) {
		return false;
	}

	const lastHeldEntityId = worldCharacterEntity.heldItemIds.pop();
	if (!lastHeldEntityId) {
		return false;
	}

	const { instanceId } = EntityIdUtils.parse(lastHeldEntityId);
	const worldItem = getWorldItem(instanceId as WorldItemId);

	// 엔티티는 이미 줍기 시 제거됨
	const itemEntity = worldCharacterEntity.worldContext.entities[lastHeldEntityId];
	if (itemEntity) {
		itemEntity.removeFromWorld();
	}

	// worldItem을 스토어에서 완전히 제거
	if (worldItem) {
		worldItemStore.update((state) =>
			produce(state, (draft) => {
				delete draft.data[instanceId as WorldItemId];
			})
		);
	}

	return false;
}

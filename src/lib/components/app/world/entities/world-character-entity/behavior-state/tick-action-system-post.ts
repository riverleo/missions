import { useBehavior, useWorld } from '$lib/hooks';
import { produce } from 'immer';
import { EntityIdUtils } from '$lib/utils/entity-id';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type { WorldItemId } from '$lib/types';

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

	const worldCharacterEntity = this.worldCharacterEntity;
	const behaviorAction = getBehaviorAction(this.behaviorTargetId);
	if (!behaviorAction) return false;

	// fulfill 타입이 아니면 skip
	if (behaviorAction.type !== 'fulfill') return false;

	const interaction = getInteraction(behaviorAction);
	if (!interaction) return false;

	// 아이템 인터렉션이 아니면 skip
	if (!('item_interaction_id' in interaction)) return false;

	// 인터렉션 체인이 완료되었는지 확인
	if (this.interactionTargetId) return false; // 아직 진행 중

	// 들고 있는 아이템 제거
	if (worldCharacterEntity.heldItemIds.length === 0) return false;

	const lastHeldEntityId = worldCharacterEntity.heldItemIds.pop();
	if (!lastHeldEntityId) return false;

	const { instanceId } = EntityIdUtils.parse(lastHeldEntityId);
	const worldItem = getWorldItem(instanceId as WorldItemId);

	// worldItem의 world_character_id = null
	if (worldItem) {
		worldItemStore.update((state) =>
			produce(state, (draft) => {
				draft.data[instanceId as WorldItemId] = {
					...worldItem,
					world_character_id: null,
					world_building_id: null,
				};
			})
		);
	}

	return false;
}

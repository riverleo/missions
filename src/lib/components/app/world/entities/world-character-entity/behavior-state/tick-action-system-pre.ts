import { useBehavior, useWorld } from '$lib/hooks';
import { produce } from 'immer';
import { EntityIdUtils } from '$lib/utils/entity-id';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type { WorldItemId } from '$lib/types';

/**
 * 시스템 행동 전처리 (아이템 줍기)
 *
 * 타겟 엔티티가 아이템이고 아직 들고 있지 않은 경우 줍기 인터렉션을 실행합니다.
 *
 * @returns true: 행동 실행 중단, false: 행동 실행 계속 진행
 */
export default function tickActionSystemPre(
	this: WorldCharacterEntityBehavior,
	tick: number
): boolean {
	const { getBehaviorAction } = useBehavior();
	const { getWorldItem, worldItemStore } = useWorld();

	const behaviorAction = getBehaviorAction(this.behaviorTargetId);
	if (!behaviorAction) return false;

	// idle이거나 타겟이 없으면 skip
	if (behaviorAction.type === 'idle' || !this.targetEntityId) return false;

	const worldCharacterEntity = this.worldCharacterEntity;
	const targetEntity = worldCharacterEntity.worldContext.entities[this.targetEntityId];

	// 타겟이 아이템이 아니면 skip
	if (!targetEntity || targetEntity.type !== 'item') return false;

	const worldItemId = targetEntity.instanceId as WorldItemId;
	const itemEntityId = EntityIdUtils.createId(
		'item',
		worldCharacterEntity.worldContext.worldId,
		worldItemId
	);

	// 이미 들고 있으면 skip
	if (worldCharacterEntity.heldItemIds.includes(itemEntityId)) return false;

	// 아이템 줍기
	worldCharacterEntity.heldItemIds.push(itemEntityId);

	// 바디를 월드에서 제거
	targetEntity.removeFromWorld();

	// worldItem.world_character_id 업데이트
	const worldItem = getWorldItem(worldItemId);
	if (worldItem) {
		worldItemStore.update((state) =>
			produce(state, (draft) => {
				draft.data[worldItemId] = {
					...worldItem,
					world_character_id: worldCharacterEntity.instanceId,
					world_building_id: null,
				};
			})
		);
	}

	// 타겟 클리어 (이제 들고 있으므로)
	this.targetEntityId = undefined;

	return false;
}

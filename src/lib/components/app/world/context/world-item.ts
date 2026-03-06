import { useWorld } from '$lib/hooks';
import type { WorldContext } from './world-context.svelte';
import type { WorldItemId } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { WorldItemEntity } from '../entities/world-item-entity';

export function createWorldItem(
	worldContext: WorldContext,
	insert: Omit<Parameters<ReturnType<typeof useWorld>['createWorldItem']>[0], 'world_id'>
) {
	const world = useWorld();

	// useWorld CRUD로 데이터 생성
	const worldItem = world.createWorldItem({ ...insert, world_id: worldContext.worldId });

	// 엔티티 생성 (world_building_id와 world_character_id가 모두 null일 때만 월드에 추가)
	const entity = new WorldItemEntity(worldContext, worldContext.worldId, worldItem.id);
	if (worldItem.world_building_id === null && worldItem.world_character_id === null) {
		entity.addToWorld();
	}
}

export function deleteWorldItem(worldItemId: WorldItemId, worldContext?: WorldContext) {
	const { getWorldItem, deleteWorldItem: hookDelete } = useWorld();
	const worldItem = getWorldItem(worldItemId);
	if (!worldItem) return;

	// worldContext가 있으면 엔티티 제거
	if (worldContext) {
		const entityId = EntityIdUtils.create(
			'item',
			worldContext.worldId,
			worldItem.item_id,
			worldItemId
		);
		const entity = worldContext.entities[entityId];
		if (entity) {
			entity.removeFromWorld();
		}
	}

	// 스토어에서 제거 (useWorld CRUD)
	hookDelete(worldItemId);
}

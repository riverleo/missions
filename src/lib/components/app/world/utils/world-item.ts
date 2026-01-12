import type { WorldContext } from '../context';
import type { WorldItem, WorldItemId, WorldItemInsert } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { useWorld } from '$lib/hooks/use-world';
import { WorldItemEntity } from '../entities/world-item-entity';

export function createWorldItem(worldContext: WorldContext, insert: WorldItemInsert) {
	const { worldItemStore } = useWorld();

	const worldItem: WorldItem = {
		id: crypto.randomUUID() as WorldItemId,
		...insert,
		created_at: new Date().toISOString(),
		created_at_tick: 0,
	} as WorldItem;

	// 스토어 업데이트
	worldItemStore.update((state) => ({
		...state,
		data: { ...state.data, [worldItem.id]: worldItem },
	}));

	// 엔티티 생성
	const entity = new WorldItemEntity(worldContext, worldContext.worldId, worldItem.id);
	entity.addToWorld();
}

export function deleteWorldItem(worldContext: WorldContext, worldItemId: WorldItemId) {
	const { worldItemStore } = useWorld();

	// 엔티티 제거
	const entityId = EntityIdUtils.create('item', worldContext.worldId, worldItemId);
	const entity = worldContext.entities[entityId];
	if (entity) {
		entity.removeFromWorld();
	}

	// 스토어 업데이트
	worldItemStore.update((state) => {
		const newData = { ...state.data };
		delete newData[worldItemId];
		return { ...state, data: newData };
	});
}

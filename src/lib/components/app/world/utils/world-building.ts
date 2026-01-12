import type { WorldContext } from '../context';
import type { WorldBuilding, WorldBuildingId, WorldBuildingInsert } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { useWorld } from '$lib/hooks/use-world';
import { WorldBuildingEntity } from '../entities/world-building-entity';

export function createWorldBuilding(worldContext: WorldContext, insert: WorldBuildingInsert) {
	const { worldBuildingStore } = useWorld();

	const worldBuilding: WorldBuilding = {
		id: crypto.randomUUID() as WorldBuildingId,
		...insert,
		created_at: new Date().toISOString(),
		created_at_tick: 0,
	} as WorldBuilding;

	// 스토어 업데이트
	worldBuildingStore.update((state) => ({
		...state,
		data: { ...state.data, [worldBuilding.id]: worldBuilding },
	}));

	// 엔티티 생성
	const entity = new WorldBuildingEntity(worldContext, worldContext.worldId, worldBuilding.id);
	entity.addToWorld();
}

export function deleteWorldBuilding(
	worldContext: WorldContext,
	worldBuildingId: WorldBuildingId
) {
	const { worldBuildingStore } = useWorld();

	// 엔티티 제거
	const entityId = EntityIdUtils.create('building', worldContext.worldId, worldBuildingId);
	const entity = worldContext.entities[entityId];
	if (entity) {
		entity.removeFromWorld();
	}

	// 스토어 업데이트
	worldBuildingStore.update((state) => {
		const newData = { ...state.data };
		delete newData[worldBuildingId];
		return { ...state, data: newData };
	});
}

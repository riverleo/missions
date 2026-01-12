import type { WorldContext } from '../context';
import type { WorldCharacter, WorldCharacterId, WorldCharacterInsert } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { useWorld } from '$lib/hooks/use-world';
import { WorldCharacterEntity } from '../entities/world-character-entity';

export function createWorldCharacter(worldContext: WorldContext, insert: WorldCharacterInsert) {
	const { worldCharacterStore } = useWorld();

	const worldCharacter: WorldCharacter = {
		id: crypto.randomUUID() as WorldCharacterId,
		...insert,
		created_at: new Date().toISOString(),
	} as WorldCharacter;

	// 스토어 업데이트
	worldCharacterStore.update((state) => ({
		...state,
		data: { ...state.data, [worldCharacter.id]: worldCharacter },
	}));

	// 엔티티 생성
	const entity = new WorldCharacterEntity(worldContext, worldContext.worldId, worldCharacter.id);
	entity.addToWorld();
}

export function deleteWorldCharacter(
	worldContext: WorldContext,
	worldCharacterId: WorldCharacterId
) {
	const { worldCharacterStore } = useWorld();

	// 엔티티 제거
	const entityId = EntityIdUtils.create('character', worldContext.worldId, worldCharacterId);
	const entity = worldContext.entities[entityId];
	if (entity) {
		entity.removeFromWorld();
	}

	// 스토어 업데이트
	worldCharacterStore.update((state) => {
		const newData = { ...state.data };
		delete newData[worldCharacterId];
		return { ...state, data: newData };
	});
}

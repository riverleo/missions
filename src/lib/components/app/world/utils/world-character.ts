import { get } from 'svelte/store';
import type { WorldContext } from '../context';
import type { WorldCharacter, WorldCharacterId, WorldCharacterInsert, UserId } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { useWorld } from '$lib/hooks/use-world';
import { usePlayer } from '$lib/hooks/use-player';
import { WorldCharacterEntity } from '../entities/world-character-entity';
import {
	TEST_WORLD_ID,
	TEST_PLAYER_ID,
	TEST_SCENARIO_ID,
} from '$lib/hooks/use-world/use-world-test';

export function createWorldCharacter(
	worldContext: WorldContext,
	insert: Omit<WorldCharacterInsert, 'world_id' | 'player_id' | 'scenario_id' | 'user_id'>
) {
	const { worldCharacterStore } = useWorld();
	const isTestWorld = worldContext.worldId === TEST_WORLD_ID;

	let player_id, scenario_id, user_id;
	if (isTestWorld) {
		player_id = TEST_PLAYER_ID;
		scenario_id = TEST_SCENARIO_ID;
		user_id = crypto.randomUUID() as UserId;
	} else {
		const player = get(usePlayer().current);
		const world = get(useWorld().worldStore).data[worldContext.worldId];
		player_id = player!.id;
		scenario_id = world!.scenario_id;
		user_id = player!.user_id;
	}

	const worldCharacter: WorldCharacter = {
		id: crypto.randomUUID() as WorldCharacterId,
		...insert,
		world_id: worldContext.worldId,
		player_id,
		scenario_id,
		user_id,
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

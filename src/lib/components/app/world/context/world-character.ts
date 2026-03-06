import { useCharacter, useCurrent, useWorld } from '$lib/hooks';
import { get } from 'svelte/store';
import type { WorldContext } from './world-context.svelte';
import type {
	WorldCharacter,
	WorldCharacterId,
	WorldCharacterInsert,
	WorldCharacterNeed,
	WorldCharacterNeedId,
	UserId,
} from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { WorldCharacterEntity } from '../entities/world-character-entity';

export function createWorldCharacter(
	worldContext: WorldContext,
	insert: Required<
		Omit<
			WorldCharacterInsert,
			| 'id'
			| 'world_id'
			| 'player_id'
			| 'scenario_id'
			| 'user_id'
			| 'created_at'
			| 'created_at_tick'
			| 'deleted_at'
		>
	> &
		Pick<WorldCharacterInsert, 'id' | 'created_at' | 'created_at_tick'>
) {
	const { setWorldCharacter, setWorldCharacterNeeds, getAllWorldCharacterNeeds } = useWorld();
	const { playerStore, playerScenarioStore, tickStore } = useCurrent();

	const player = get(playerStore);
	const playerScenario = get(playerScenarioStore);
	const player_id = player!.id;
	const scenario_id = playerScenario!.scenario_id;
	const user_id = player!.user_id;

	// 클라이언트에서 UUID 생성, DB 영속화는 스냅샷으로 처리
	const worldCharacterId = crypto.randomUUID() as WorldCharacterId;
	const { needStore, getAllCharacterNeeds } = useCharacter();
	const characterNeeds = getAllCharacterNeeds().filter(
		(cn) => cn.character_id === insert.character_id
	);
	const needs = get(needStore).data;

	const worldCharacter: WorldCharacter = {
		...insert,
		id: worldCharacterId,
		world_id: worldContext.worldId,
		player_id,
		scenario_id,
		user_id,
		created_at: new Date().toISOString(),
		created_at_tick: get(tickStore),
		deleted_at: null,
	};

	// WorldCharacterNeed 생성
	const worldCharacterNeeds: WorldCharacterNeed[] = characterNeeds.map((cn) => ({
		id: crypto.randomUUID() as WorldCharacterNeedId,
		scenario_id,
		user_id,
		player_id,
		world_id: worldContext.worldId,
		character_id: insert.character_id,
		world_character_id: worldCharacterId,
		need_id: cn.need_id,
		value: needs[cn.need_id]?.initial_value ?? 50,
		deleted_at: null,
	}));

	// 스토어 업데이트 (useWorld CRUD)
	setWorldCharacterNeeds(worldCharacterNeeds);
	setWorldCharacter(worldCharacter);

	// 엔티티 생성
	const entity = new WorldCharacterEntity(worldContext, worldContext.worldId, worldCharacter.id);

	// 스토어에서 needs를 불러와서 설정 (spread로 복사하여 프록시 해제)
	const loadedNeeds = getAllWorldCharacterNeeds().filter(
		(need) => need.world_character_id === worldCharacter.id
	);
	entity.needs = {};
	for (const need of loadedNeeds) {
		entity.needs[need.need_id] = { ...need };
	}

	entity.addToWorld();
}

export function deleteWorldCharacter(
	worldCharacterId: WorldCharacterId,
	worldContext?: WorldContext
) {
	const { getWorldCharacter, removeWorldCharacter, removeWorldCharacterNeedsByCharacter } =
		useWorld();
	const worldCharacter = getWorldCharacter(worldCharacterId);
	if (!worldCharacter) return;

	// worldContext가 있으면 엔티티 제거
	if (worldContext) {
		const entityId = EntityIdUtils.create(
			'character',
			worldContext.worldId,
			worldCharacter.character_id,
			worldCharacterId
		);
		const entity = worldContext.entities[entityId];
		if (entity) {
			entity.removeFromWorld();
		}
	}

	// 스토어에서 제거 (useWorld CRUD)
	removeWorldCharacterNeedsByCharacter(worldCharacterId);
	removeWorldCharacter(worldCharacterId);
}

import { useCharacter, useWorld } from '$lib/hooks';
import { get } from 'svelte/store';
import type { WorldContext } from './world-context.svelte';
import type { WorldCharacterId } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { WorldCharacterEntity } from '../entities/world-character-entity';

export function createWorldCharacter(
	worldContext: WorldContext,
	insert: Omit<Parameters<ReturnType<typeof useWorld>['createWorldCharacter']>[0], 'world_id'>
) {
	const world = useWorld();
	const { needStore, getAllCharacterNeeds } = useCharacter();

	// useWorld CRUD로 데이터 생성
	const worldCharacter = world.createWorldCharacter({ ...insert, world_id: worldContext.worldId });

	// CharacterNeed 템플릿에서 needs 조회 후 WorldCharacterNeeds 생성
	const characterNeeds = getAllCharacterNeeds().filter(
		(cn) => cn.character_id === insert.character_id
	);
	const needs = get(needStore).data;
	const worldCharacterNeeds = world.createWorldCharacterNeeds(
		{
			world_id: worldContext.worldId,
			world_character_id: worldCharacter.id,
			character_id: insert.character_id,
		},
		characterNeeds.map((cn) => ({
			need_id: cn.need_id,
			value: needs[cn.need_id]?.initial_value ?? 50,
		}))
	);

	// 엔티티 생성
	const entity = new WorldCharacterEntity(worldContext, worldContext.worldId, worldCharacter.id);

	// needs를 엔티티에 설정 (spread로 복사하여 프록시 해제)
	entity.needs = {};
	for (const need of worldCharacterNeeds) {
		entity.needs[need.need_id] = { ...need };
	}

	entity.addToWorld();
}

export function deleteWorldCharacter(
	worldCharacterId: WorldCharacterId,
	worldContext?: WorldContext
) {
	const { getWorldCharacter, deleteWorldCharacter: hookDelete, deleteWorldCharacterNeedsByCharacter } =
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
	deleteWorldCharacterNeedsByCharacter(worldCharacterId);
	hookDelete(worldCharacterId);
}

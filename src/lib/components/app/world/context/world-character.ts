import { useCharacter, useCurrent, useWorld } from '$lib/hooks';
import { get } from 'svelte/store';
import { produce } from 'immer';
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

export async function createWorldCharacter(
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
	const { worldCharacterStore, worldCharacterNeedStore } = useWorld();
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

	// WorldCharacterNeed를 별도 스토어에 저장
	const worldCharacterNeeds = characterNeeds.map((cn) => ({
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

	worldCharacterNeedStore.update((state) =>
		produce(state, (draft) => {
			for (const worldCharacterNeed of worldCharacterNeeds) {
				draft.data[worldCharacterNeed.id] = worldCharacterNeed;
			}
		})
	);

	// 스토어 업데이트
	worldCharacterStore.update((state) =>
		produce(state, (draft) => {
			draft.data[worldCharacter.id] = worldCharacter;
		})
	);

	// 엔티티 생성
	const entity = new WorldCharacterEntity(worldContext, worldContext.worldId, worldCharacter.id);

	// 스토어에서 needs를 불러와서 설정 (spread로 복사하여 프록시 해제)
	const { getAllWorldCharacterNeeds } = useWorld();
	const loadedNeeds = getAllWorldCharacterNeeds().filter(
		(need) => need.world_character_id === worldCharacter.id
	);
	entity.needs = {};
	for (const need of loadedNeeds) {
		entity.needs[need.need_id] = { ...need };
	}

	entity.addToWorld();
}

export async function deleteWorldCharacter(
	worldCharacterId: WorldCharacterId,
	worldContext?: WorldContext
) {
	const { worldCharacterStore, worldCharacterNeedStore, getWorldCharacter } = useWorld();
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

	// WorldCharacterNeed 제거
	worldCharacterNeedStore.update((state) =>
		produce(state, (draft) => {
			for (const [id, need] of Object.entries(draft.data)) {
				if (need?.world_character_id === worldCharacterId) {
					delete draft.data[id as WorldCharacterNeedId];
				}
			}
		})
	);

	// 스토어 업데이트
	worldCharacterStore.update((state) => {
		const newData = { ...state.data };
		delete newData[worldCharacterId];
		return { ...state, data: newData };
	});
}

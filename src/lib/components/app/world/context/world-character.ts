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
import { useApp } from '$lib/hooks';
import { WorldCharacterEntity } from '../entities/world-character-entity';
import { TEST_USER_ID, TEST_WORLD_ID, TEST_PLAYER_ID, TEST_SCENARIO_ID } from '$lib/constants';

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
	const { worldCharacterStore } = useWorld();
	const { playerStore, playerScenarioStore, tickStore } = useCurrent();
	const isTestWorld = worldContext.worldId === TEST_WORLD_ID;

	const player = get(playerStore);
	const playerScenario = get(playerScenarioStore);
	const player_id = player!.id;
	const scenario_id = playerScenario!.scenario_id;
	const user_id = player!.user_id;

	let worldCharacter: WorldCharacter;

	if (isTestWorld) {
		// TEST 환경: 클라이언트에서 UUID 생성
		const worldCharacterId = crypto.randomUUID() as WorldCharacterId;
		const { worldCharacterNeedStore } = useWorld();
		const { needStore, getAllCharacterNeeds } = useCharacter();
		const characterNeeds = getAllCharacterNeeds().filter(
			(cn) => cn.character_id === insert.character_id
		);
		const needs = get(needStore).data;

		worldCharacter = {
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
	} else {
		// 프로덕션 환경: 서버에 저장하고 반환된 데이터 사용
		const { supabase } = useApp();

		// WorldCharacter insert
		const insertData = {
			...insert,
			world_id: worldContext.worldId,
			player_id,
			scenario_id,
			user_id,
			created_at_tick: get(tickStore),
		};

		const { data: insertResult, error: insertError } = await supabase
			.from('world_characters')
			.insert(insertData)
			.select('id')
			.single<{ id: WorldCharacterId }>();

		if (insertError || !insertResult) {
			console.error('Failed to create world character:', insertError);
			throw insertError;
		}

		const worldCharacterId = insertResult.id;

		// WorldCharacterNeed insert
		const { needStore, getAllCharacterNeeds } = useCharacter();
		const characterNeeds = getAllCharacterNeeds().filter(
			(cn) => cn.character_id === insert.character_id
		);

		if (characterNeeds.length > 0) {
			const needs = get(needStore).data;

			const worldCharacterNeedsInserts = characterNeeds.map((cn) => ({
				scenario_id,
				user_id,
				player_id,
				world_id: worldContext.worldId,
				character_id: insert.character_id,
				world_character_id: worldCharacterId,
				need_id: cn.need_id,
				value: needs[cn.need_id]?.initial_value ?? 50,
			}));

			const { error: needsError } = await supabase
				.from('world_character_needs')
				.insert(worldCharacterNeedsInserts);

			if (needsError) {
				console.error('Failed to create world character needs:', needsError);
			}
		}

		// WorldCharacter selectOne
		const { data, error } = await supabase
			.from('world_characters')
			.select('*')
			.eq('id', worldCharacterId)
			.single<WorldCharacter>();

		if (error || !data) {
			console.error('Failed to fetch world character:', error);
			throw error;
		}

		worldCharacter = data;
	}

	// 스토어 업데이트
	worldCharacterStore.update((state) =>
		produce(state, (draft) => {
			draft.data[worldCharacter.id] = worldCharacter;
		})
	);

	// 엔티티 생성
	const entity = new WorldCharacterEntity(worldContext, worldContext.worldId, worldCharacter.id);

	// TEST 환경에서는 스토어에서 needs를 다시 불러와서 설정 (spread로 복사하여 프록시 해제)
	if (isTestWorld) {
		const { getAllWorldCharacterNeeds } = useWorld();
		const characterNeeds = getAllWorldCharacterNeeds().filter(
			(need) => need.world_character_id === worldCharacter.id
		);
		entity.needs = {};
		for (const need of characterNeeds) {
			entity.needs[need.need_id] = { ...need };
		}
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

	const isTestWorld = worldCharacter.world_id === TEST_WORLD_ID;

	// 프로덕션 환경이면 서버에서 soft delete
	if (!isTestWorld) {
		const { supabase } = useApp();
		const deletedAt = new Date().toISOString();

		const [characterResult, needsResult] = await Promise.all([
			supabase
				.from('world_characters')
				.update({ deleted_at: deletedAt })
				.eq('id', worldCharacterId),
			supabase
				.from('world_character_needs')
				.update({ deleted_at: deletedAt })
				.eq('world_character_id', worldCharacterId),
		]);

		if (characterResult.error) {
			console.error('Failed to delete world character:', characterResult.error);
			throw characterResult.error;
		}

		if (needsResult.error) {
			console.error('Failed to delete world character needs:', needsResult.error);
			throw needsResult.error;
		}
	}

	// worldContext가 있으면 엔티티 제거
	if (worldContext) {
		const entityId = EntityIdUtils.createId('character', worldContext.worldId, worldCharacterId);
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

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
import { useWorld } from '$lib/hooks/use-world';
import { useCurrent } from '$lib/hooks/use-current';
import { useApp } from '$lib/hooks/use-app.svelte';
import { useCharacter } from '$lib/hooks/use-character';
import { WorldCharacterEntity } from '../entities/world-character-entity';
import { TEST_USER_ID, TEST_WORLD_ID, TEST_PLAYER_ID, TEST_SCENARIO_ID } from '$lib/constants';

export async function createWorldCharacter(
	worldContext: WorldContext,
	insert: Required<
		Omit<
			WorldCharacterInsert,
			'id' | 'world_id' | 'player_id' | 'scenario_id' | 'user_id' | 'created_at' | 'created_at_tick' | 'deleted_at'
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
		const { characterNeedStore, needStore } = useCharacter();
		const characterNeeds = Object.values(get(characterNeedStore).data).filter(
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
			held_world_item_id: insert.held_world_item_id ?? null,
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

		worldCharacterNeedStore.update((state) => {
			const newData = { ...state.data };
			for (const need of worldCharacterNeeds) {
				newData[need.id] = need;
			}
			return { ...state, data: newData };
		});
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
		const { characterNeedStore, needStore } = useCharacter();
		const characterNeeds = Object.values(get(characterNeedStore).data).filter(
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
	worldCharacterStore.update((state) => ({
		...state,
		data: { ...state.data, [worldCharacter.id]: worldCharacter },
	}))

	// 엔티티 생성
	const entity = new WorldCharacterEntity(worldContext, worldContext.worldId, worldCharacter.id);
	entity.addToWorld();
}

export async function deleteWorldCharacter(
	worldContext: WorldContext,
	worldCharacterId: WorldCharacterId
) {
	const { worldCharacterStore } = useWorld();
	const isTestWorld = worldContext.worldId === TEST_WORLD_ID;

	// 프로덕션 환경이면 서버에서 soft delete
	if (!isTestWorld) {
		const { supabase } = useApp();
		const { error } = await supabase
			.from('world_characters')
			.update({ deleted_at: new Date().toISOString() })
			.eq('id', worldCharacterId);

		if (error) {
			console.error('Failed to delete world character:', error);
			throw error;
		}
	}

	// 엔티티 제거
	const entityId = EntityIdUtils.createId('character', worldContext.worldId, worldCharacterId);
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

import { get } from 'svelte/store';
import type { WorldContext } from './world-context.svelte';
import type { WorldCharacter, WorldCharacterId, WorldCharacterInsert, UserId } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { useWorld } from '$lib/hooks/use-world';
import { useCurrent } from '$lib/hooks/use-current';
import { useServerPayload } from '$lib/hooks/use-server-payload.svelte';
import { WorldCharacterEntity } from '../entities/world-character-entity';
import { TEST_USER_ID, TEST_WORLD_ID, TEST_PLAYER_ID, TEST_SCENARIO_ID } from '$lib/constants';

export async function createWorldCharacter(
	worldContext: WorldContext,
	insert: Required<
		Omit<
			WorldCharacterInsert,
			'id' | 'world_id' | 'player_id' | 'scenario_id' | 'user_id' | 'created_at' | 'created_at_tick'
		>
	> &
		Pick<WorldCharacterInsert, 'id' | 'created_at' | 'created_at_tick'>
) {
	const { worldCharacterStore } = useWorld();
	const isTestWorld = worldContext.worldId === TEST_WORLD_ID;

	let player_id, scenario_id, user_id;
	if (isTestWorld) {
		player_id = TEST_PLAYER_ID;
		scenario_id = TEST_SCENARIO_ID;
		user_id = TEST_USER_ID;
	} else {
		const player = get(useCurrent().player);
		const world = get(useWorld().worldStore).data[worldContext.worldId];
		player_id = player!.id;
		scenario_id = world!.scenario_id;
		user_id = player!.user_id;
	}

	let worldCharacter: WorldCharacter;

	if (isTestWorld) {
		// TEST 환경: 클라이언트에서 UUID 생성
		worldCharacter = {
			...insert,
			id: crypto.randomUUID() as WorldCharacterId,
			world_id: worldContext.worldId,
			player_id,
			scenario_id,
			user_id,
			created_at: new Date().toISOString(),
			created_at_tick: 0,
		};
	} else {
		// 프로덕션 환경: 서버에 저장하고 반환된 데이터 사용
		const { supabase } = useServerPayload();
		const { data, error } = await supabase
			.from('world_characters')
			.insert({
				...insert,
				world_id: worldContext.worldId,
				player_id,
				scenario_id,
				user_id,
			})
			.select()
			.single<WorldCharacter>();

		if (error || !data) {
			console.error('Failed to create world character:', error);
			throw error;
		}

		worldCharacter = data;
	}

	// 스토어 업데이트
	worldCharacterStore.update((state) => ({
		...state,
		data: { ...state.data, [worldCharacter.id]: worldCharacter },
	}));

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

	// 프로덕션 환경이면 서버에서 삭제
	if (!isTestWorld) {
		const { supabase } = useServerPayload();
		const { error } = await supabase.from('world_characters').delete().eq('id', worldCharacterId);

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

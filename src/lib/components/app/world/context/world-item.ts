import { get } from 'svelte/store';
import type { WorldContext } from './world-context.svelte';
import type { WorldItem, WorldItemId, WorldItemInsert, UserId } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { useWorld } from '$lib/hooks/use-world';
import { usePlayer } from '$lib/hooks/use-player';
import { useServerPayload } from '$lib/hooks/use-server-payload.svelte';
import { WorldItemEntity } from '../entities/world-item-entity';
import {
	TEST_WORLD_ID,
	TEST_PLAYER_ID,
	TEST_SCENARIO_ID,
} from '$lib/hooks/use-world/use-world-test';

export async function createWorldItem(
	worldContext: WorldContext,
	insert: Required<
		Omit<
			WorldItemInsert,
			| 'id'
			| 'world_id'
			| 'player_id'
			| 'scenario_id'
			| 'user_id'
			| 'created_at'
			| 'created_at_tick'
			| 'world_building_id'
			| 'durability_ticks'
			| 'rotation'
		>
	> &
		Pick<
			WorldItemInsert,
			| 'id'
			| 'created_at'
			| 'created_at_tick'
			| 'world_building_id'
			| 'durability_ticks'
			| 'rotation'
		>
) {
	const { worldItemStore } = useWorld();
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

	let worldItem: WorldItem;

	if (isTestWorld) {
		// TEST 환경: 클라이언트에서 UUID 생성
		worldItem = {
			...insert,
			id: crypto.randomUUID() as WorldItemId,
			world_id: worldContext.worldId,
			player_id,
			scenario_id,
			user_id,
			world_building_id: insert.world_building_id ?? null,
			durability_ticks: insert.durability_ticks ?? null,
			rotation: insert.rotation ?? 0,
			created_at: new Date().toISOString(),
			created_at_tick: 0,
		};
	} else {
		// 프로덕션 환경: 서버에 저장하고 반환된 데이터 사용
		const { supabase } = useServerPayload();
		const { data, error } = await supabase
			.from('world_items')
			.insert({
				...insert,
				world_id: worldContext.worldId,
				player_id,
				scenario_id,
				user_id,
			})
			.select()
			.single<WorldItem>();

		if (error || !data) {
			console.error('Failed to create world item:', error);
			throw error;
		}

		worldItem = data;
	}

	// 스토어 업데이트
	worldItemStore.update((state) => ({
		...state,
		data: { ...state.data, [worldItem.id]: worldItem },
	}));

	// 엔티티 생성
	const entity = new WorldItemEntity(worldContext, worldContext.worldId, worldItem.id);
	entity.addToWorld();
}

export async function deleteWorldItem(worldContext: WorldContext, worldItemId: WorldItemId) {
	const { worldItemStore } = useWorld();
	const isTestWorld = worldContext.worldId === TEST_WORLD_ID;

	// 프로덕션 환경이면 서버에서 삭제
	if (!isTestWorld) {
		const { supabase } = useServerPayload();
		const { error } = await supabase.from('world_items').delete().eq('id', worldItemId);

		if (error) {
			console.error('Failed to delete world item:', error);
			throw error;
		}
	}

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

import { useCurrent, useWorld } from '$lib/hooks';
import { get } from 'svelte/store';
import type { WorldContext } from './world-context.svelte';
import type { WorldItem, WorldItemId, WorldItemInsert, UserId } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { useApp } from '$lib/hooks';
import { WorldItemEntity } from '../entities/world-item-entity';
import { TEST_USER_ID, TEST_WORLD_ID, TEST_PLAYER_ID, TEST_SCENARIO_ID } from '$lib/constants';

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
			| 'deleted_at'
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
	const { worldItemStore, getWorldItem } = useWorld();
	const { playerStore, playerScenarioStore, tickStore } = useCurrent();
	const isTestWorld = worldContext.worldId === TEST_WORLD_ID;

	const player = get(playerStore);
	const playerScenario = get(playerScenarioStore);
	const player_id = player!.id;
	const scenario_id = playerScenario!.scenario_id;
	const user_id = player!.user_id;

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
			created_at_tick: get(tickStore),
			deleted_at: null,
		};
	} else {
		// 프로덕션 환경: 서버에 저장하고 반환된 데이터 사용
		const { supabase } = useApp();
		const { data, error } = await supabase
			.from('world_items')
			.insert({
				...insert,
				world_id: worldContext.worldId,
				player_id,
				scenario_id,
				user_id,
				created_at_tick: get(tickStore),
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

	// 엔티티 생성 (world_building_id와 world_character_id가 모두 null일 때만 월드에 추가)
	const entity = new WorldItemEntity(worldContext, worldContext.worldId, worldItem.id);
	if (worldItem.world_building_id === null && worldItem.world_character_id === null) {
		entity.addToWorld();
	}
}

export async function deleteWorldItem(worldItemId: WorldItemId, worldContext?: WorldContext) {
	const { worldItemStore, getWorldItem } = useWorld();
	const worldItem = getWorldItem(worldItemId);
	if (!worldItem) return;

	const isTestWorld = worldItem.world_id === TEST_WORLD_ID;

	// 프로덕션 환경이면 서버에서 soft delete
	if (!isTestWorld) {
		const { supabase } = useApp();
		const { error } = await supabase
			.from('world_items')
			.update({ deleted_at: new Date().toISOString() })
			.eq('id', worldItemId);

		if (error) {
			console.error('Failed to delete world item:', error);
			throw error;
		}
	}

	// worldContext가 있으면 엔티티 제거
	if (worldContext) {
		const entityId = EntityIdUtils.createId(
			'item',
			worldContext.worldId,
			worldItem.item_id,
			worldItemId
		);
		const entity = worldContext.entities[entityId];
		if (entity) {
			entity.removeFromWorld();
		}
	}

	// 스토어 업데이트
	worldItemStore.update((state) => {
		const newData = { ...state.data };
		delete newData[worldItemId];
		return { ...state, data: newData };
	});
}

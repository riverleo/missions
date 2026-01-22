import Matter from 'matter-js';
import { get } from 'svelte/store';
import type { WorldItemId, Item, WorldId } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { CATEGORY_BOUNDARY, CATEGORY_TILE, CATEGORY_ITEM } from '$lib/constants';
import { useWorld } from '$lib/hooks/use-world';
import { useItem } from '$lib/hooks/use-item';
import { Entity } from '../entity.svelte';
import type { BeforeUpdateEvent, WorldContext } from '../../context';

export class WorldItemEntity extends Entity {
	readonly type = 'item' as const;
	body: Matter.Body;

	override get instanceId(): WorldItemId {
		return EntityIdUtils.instanceId<WorldItemId>(this.id);
	}

	constructor(worldContext: WorldContext, worldId: WorldId, worldItemId: WorldItemId) {
		super(worldContext, 'item', worldId, worldItemId);

		// 스토어에서 데이터 조회
		const worldItem = get(useWorld().worldItemStore).data[worldItemId];
		const item = this.item;

		if (!worldItem) {
			throw new Error(`Cannot create WorldItemEntity: missing data for id ${worldItemId}`);
		}

		// 바디 생성 (collider 및 위치 상태도 함께 설정됨)
		this.body = this.createBody(
			item.collider_type,
			item.collider_width,
			item.collider_height,
			worldItem.x,
			worldItem.y,
			{
				isStatic: false,
				collisionFilter: {
					category: CATEGORY_ITEM,
					mask: CATEGORY_BOUNDARY | CATEGORY_TILE | CATEGORY_ITEM,
				},
			}
		);

		this.angle = worldItem.rotation;
	}

	get item(): Item {
		const worldItem = get(useWorld().worldItemStore).data[this.instanceId];
		if (!worldItem) throw new Error(`WorldItem not found for id ${this.instanceId}`);

		const item = get(useItem().store).data[worldItem.item_id];
		if (!item) throw new Error(`Item not found for id ${worldItem.item_id}`);

		return item;
	}

	save(): void {
		const { worldItemStore } = useWorld();
		const store = get(worldItemStore);
		const worldItem = store.data[this.instanceId];

		if (worldItem) {
			worldItemStore.set({
				...store,
				data: {
					...store.data,
					[this.instanceId]: {
						...worldItem,
						x: this.x,
						y: this.y,
						rotation: this.angle,
					},
				},
			});
		}
	}

	update(_: BeforeUpdateEvent): void {
		// 아이템은 물리 엔진이 자동으로 처리하므로 update 로직 없음
	}

	tick(tick: number): void {
		// 아이템 틱 로직 (필요 시 구현)
	}
}

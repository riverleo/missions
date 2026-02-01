import Matter from 'matter-js';
import { get } from 'svelte/store';
import type { WorldItemId, Item, WorldId } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { CATEGORY_BOUNDARY, CATEGORY_TILE, CATEGORY_ITEM } from '$lib/constants';
import { useWorld } from '$lib/hooks/use-world';
import { useItem } from '$lib/hooks/use-item';
import { Entity } from '../entity.svelte';
import type { BeforeUpdateEvent, WorldContext } from '../../context';
import { decreaseDurabilityTicks } from './decrease-durability-ticks';

export class WorldItemEntity extends Entity {
	readonly type = 'item' as const;
	body: Matter.Body;
	durabilityTicks = $state<number | undefined>(undefined);

	private worldHook = useWorld();
	private itemHook = useItem();

	override get instanceId(): WorldItemId {
		return EntityIdUtils.instanceId<WorldItemId>(this.id);
	}

	constructor(worldContext: WorldContext, worldId: WorldId, worldItemId: WorldItemId) {
		super(worldContext, 'item', worldId, worldItemId);

		// 스토어에서 데이터 조회
		const { getWorldItem, worldItemStore } = this.worldHook;
		const worldItem = getWorldItem(worldItemId);
		const item = this.item;

		if (!worldItem) {
			throw new Error(`Cannot create WorldItemEntity: missing data for id ${worldItemId}`);
		}

		// durability_ticks 초기화
		this.durabilityTicks = worldItem.durability_ticks ?? undefined;

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
		const { getWorldItem, worldItemStore } = this.worldHook;
		const { getItem, itemStore } = this.itemHook;

		const worldItem = getWorldItem(this.instanceId);
		if (!worldItem) throw new Error(`WorldItem not found for id ${this.instanceId}`);

		const item = getItem(worldItem.item_id);
		if (!item) throw new Error(`Item not found for id ${worldItem.item_id}`);

		return item;
	}

	save(): void {
		const { worldItemStore } = this.worldHook;
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
						durability_ticks: this.durabilityTicks ?? null,
					},
				},
			});
		}
	}

	update(_: BeforeUpdateEvent): void {
		// 아이템은 물리 엔진이 자동으로 처리하므로 update 로직 없음
	}

	tick(tick: number): void {
		decreaseDurabilityTicks(this);
	}
}

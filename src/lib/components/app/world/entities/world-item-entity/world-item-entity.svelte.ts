import { useItem, useWorld } from '$lib/hooks';
import Matter from 'matter-js';
import type { WorldItemId, Item, ItemId, WorldId } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { CATEGORY_BOUNDARY, CATEGORY_TILE, CATEGORY_ITEM } from '$lib/constants';
import { Entity } from '../entity.svelte';
import type { BeforeUpdateEvent, WorldContext } from '../../context';
import tickDecreaseDurabilities from './tick-decrease-durabilities';

export class WorldItemEntity extends Entity {
	readonly type = 'item' as const;
	body: Matter.Body;
	durabilityTicks = $state<number | undefined>(undefined);

	tickDecreaseDurabilities = tickDecreaseDurabilities;

	override get instanceId(): WorldItemId {
		return EntityIdUtils.instanceId<WorldItemId>(this.id);
	}

	get sourceId() {
		return this.item.id;
	}

	constructor(worldContext: WorldContext, worldId: WorldId, worldItemId: WorldItemId) {
		// 스토어에서 데이터 조회
		const { getWorldItem } = useWorld();
		const worldItem = getWorldItem(worldItemId);

		if (!worldItem) {
			throw new Error(`Cannot create WorldItemEntity: missing data for id ${worldItemId}`);
		}

		super(worldContext, 'item', worldId, worldItem.item_id, worldItemId);

		const item = this.item;

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
		const { getItem } = useItem();
		return getItem(EntityIdUtils.sourceId<ItemId>(this.id));
	}

	save(): void {
		const { updateWorldItem } = useWorld();

		updateWorldItem(this.instanceId, {
			x: this.x,
			y: this.y,
			rotation: this.angle,
			durability_ticks: this.durabilityTicks ?? null,
		});
	}

	update(_: BeforeUpdateEvent): void {
		// 아이템은 물리 엔진이 자동으로 처리하므로 update 로직 없음
	}

	tick(tick: number): void {
		this.tickDecreaseDurabilities(tick);
	}
}

import Matter from 'matter-js';
import { get } from 'svelte/store';
import type { WorldItemId, Item } from '$lib/types';
import {
	CATEGORY_WALL,
	CATEGORY_TERRAIN,
	CATEGORY_ITEM,
	CATEGORY_CHARACTER,
	DEBUG_ITEM_FILL_STYLE,
} from '../../constants';
import { useWorldContext, useWorld } from '$lib/hooks/use-world';
import { useItem } from '$lib/hooks/use-item';
import { Entity } from '../entity.svelte';

const { Bodies } = Matter;

export class WorldItemEntity extends Entity {
	readonly id: WorldItemId;
	readonly type = 'item' as const;
	readonly body: Matter.Body;
	readonly size: { width: number; height: number };

	protected readonly world = useWorldContext();
	protected get debugFillStyle(): string {
		return DEBUG_ITEM_FILL_STYLE;
	}

	constructor(id: WorldItemId) {
		super();
		this.id = id;

		// 스토어에서 데이터 조회
		const worldItem = get(useWorld().worldItemStore).data[id];
		const item = this.item;

		if (!worldItem || !item) {
			throw new Error(`Cannot create WorldItemEntity: missing data for id ${id}`);
		}

		// 아이템 크기 (item 데이터에서 가져옴)
		const width = item.width;
		const height = item.height;
		this.size = { width, height };

		// 사각형 dynamic 바디 생성 (회전 가능, 아이템끼리만 충돌)
		this.body = Bodies.rectangle(worldItem.x, worldItem.y, width, height, {
			label: id,
			isStatic: false,
			collisionFilter: {
				category: CATEGORY_ITEM,
				mask: CATEGORY_WALL | CATEGORY_TERRAIN | CATEGORY_ITEM,
			},
			render: this.world.debug
				? { visible: true, fillStyle: DEBUG_ITEM_FILL_STYLE }
				: { visible: false },
		});

		// 초기 위치 설정
		this.x = worldItem.x;
		this.y = worldItem.y;
		this.angle = worldItem.rotation;
	}

	get item(): Item | undefined {
		const worldItem = get(useWorld().worldItemStore).data[this.id];
		if (!worldItem) return undefined;

		return get(useItem().store).data[worldItem.item_id];
	}

	saveToStore(): void {
		// 아이템은 물리 시뮬레이션으로 위치가 변경되지만 DB에 저장하지 않음
		// (게임 로직에서 필요시 구현)
	}
}

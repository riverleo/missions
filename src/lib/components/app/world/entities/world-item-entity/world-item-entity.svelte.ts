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

// 아이템 크기 (픽셀)
const ITEM_SIZE = 32;

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

		// 아이템 크기 (고정)
		const width = ITEM_SIZE;
		const height = ITEM_SIZE;
		this.size = { width, height };

		// 사각형 static 바디 생성
		this.body = Bodies.rectangle(worldItem.x, worldItem.y, width, height, {
			label: id,
			isStatic: true,
			collisionFilter: {
				category: CATEGORY_ITEM,
				mask: CATEGORY_WALL | CATEGORY_TERRAIN | CATEGORY_CHARACTER,
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
		// 아이템은 static이므로 실제로 위치 변경 없음
		// 하지만 일관성을 위해 인터페이스 제공
	}
}

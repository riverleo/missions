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
	body: Matter.Body;

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

		// 바디 생성
		this.body = this.createBody(item.width, item.height, worldItem.x, worldItem.y);

		// 초기 위치 설정
		this.x = worldItem.x;
		this.y = worldItem.y;
		this.angle = worldItem.rotation;
	}

	private createBody(width: number, height: number, x: number, y: number): Matter.Body {
		return Bodies.rectangle(x, y, width, height, {
			label: this.id,
			isStatic: false,
			collisionFilter: {
				category: CATEGORY_ITEM,
				mask: CATEGORY_WALL | CATEGORY_TERRAIN | CATEGORY_ITEM,
			},
			render: this.world.debug
				? { visible: true, fillStyle: DEBUG_ITEM_FILL_STYLE }
				: { visible: false },
		});
	}

	get item(): Item | undefined {
		const worldItem = get(useWorld().worldItemStore).data[this.id];
		if (!worldItem) return undefined;

		return get(useItem().store).data[worldItem.item_id];
	}

	sync(): void {
		const item = this.item;
		if (!item) return;

		// bounds에서 현재 바디 크기 추출
		const currentWidth = this.body.bounds.max.x - this.body.bounds.min.x;
		const currentHeight = this.body.bounds.max.y - this.body.bounds.min.y;

		// 크기가 변경되었으면 바디 재생성
		if (Math.abs(currentWidth - item.width) > 0.01 || Math.abs(currentHeight - item.height) > 0.01) {
			const currentPosition = this.body.position;
			const currentVelocity = this.body.velocity;
			const currentAngle = this.body.angle;

			// 월드에서 기존 바디 제거
			Matter.Composite.remove(this.world.engine.world, this.body);

			// 새 바디 생성
			this.body = this.createBody(item.width, item.height, currentPosition.x, currentPosition.y);

			// 속도/각도 복원
			Matter.Body.setVelocity(this.body, currentVelocity);
			Matter.Body.setAngle(this.body, currentAngle);

			// 월드에 새 바디 추가
			Matter.Composite.add(this.world.engine.world, this.body);
		}
	}

	saveToStore(): void {
		// 아이템은 물리 시뮬레이션으로 위치가 변경되지만 DB에 저장하지 않음
		// (게임 로직에서 필요시 구현)
	}
}

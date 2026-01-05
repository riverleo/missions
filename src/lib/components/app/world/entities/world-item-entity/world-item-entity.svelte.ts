import Matter from 'matter-js';
import { get } from 'svelte/store';
import type { WorldItemId, Item } from '$lib/types';
import {
	CATEGORY_WALL,
	CATEGORY_TERRAIN,
	CATEGORY_ITEM,
	CATEGORY_CHARACTER,
} from '../../constants';
import { useWorldContext, useWorld } from '$lib/hooks/use-world';
import { useItem } from '$lib/hooks/use-item';
import { Entity } from '../entity.svelte';
import type { BeforeUpdateEvent } from '../../context';

const { Bodies } = Matter;

export class WorldItemEntity extends Entity {
	readonly id: WorldItemId;
	readonly type = 'item' as const;
	body: Matter.Body;

	protected readonly world = useWorldContext();

	constructor(id: WorldItemId) {
		super();
		this.id = id;

		// 스토어에서 데이터 조회
		const worldItem = get(useWorld().worldItemStore).data[id];
		const item = this.item;

		if (!worldItem || !item) {
			throw new Error(`Cannot create WorldItemEntity: missing data for id ${id}`);
		}

		// 초기 크기 설정
		this.width = item.collider_width;
		this.height = item.collider_height;

		// 바디 생성
		this.body = this.createBody(item.collider_width, item.collider_height, worldItem.x, worldItem.y);

		// 초기 위치 설정
		this.x = worldItem.x;
		this.y = worldItem.y;
		this.angle = worldItem.rotation;
	}

	private createBody(width: number, height: number, x: number, y: number): Matter.Body {
		const item = this.item;
		if (!item) {
			throw new Error('Cannot create body: item not found');
		}

		const options = {
			label: this.id,
			isStatic: false,
			collisionFilter: {
				category: CATEGORY_ITEM,
				mask: CATEGORY_WALL | CATEGORY_TERRAIN | CATEGORY_ITEM,
			},
			render: {
				visible: this.world.debug,
			},
		};

		if (item.collider_type === 'circle') {
			const radius = width / 2;
			return Bodies.circle(x, y, radius, options);
		} else {
			return Bodies.rectangle(x, y, width, height, options);
		}
	}

	get item(): Item | undefined {
		const worldItem = get(useWorld().worldItemStore).data[this.id];
		if (!worldItem) return undefined;

		return get(useItem().store).data[worldItem.item_id];
	}

	sync(): void {
		const item = this.item;
		if (!item) return;

		// 스토어 값이 실제로 변경되었는지 확인
		const widthDiff = Math.abs(this.width - item.collider_width);
		const heightDiff = Math.abs(this.height - item.collider_height);

		// 크기가 변경되었으면 바디 재생성
		if (widthDiff > 0.01 || heightDiff > 0.01) {
			const currentPosition = this.body.position;
			const currentVelocity = this.body.velocity;
			const currentAngle = this.body.angle;

			// 월드에서 기존 바디 제거
			Matter.Composite.remove(this.world.engine.world, this.body);

			// 새 바디 생성
			this.body = this.createBody(item.collider_width, item.collider_height, currentPosition.x, currentPosition.y);

			// 속도/각도 복원
			Matter.Body.setVelocity(this.body, currentVelocity);
			Matter.Body.setAngle(this.body, currentAngle);

			// 월드에 새 바디 추가
			Matter.Composite.add(this.world.engine.world, this.body);

			// 크기 업데이트
			this.width = item.collider_width;
			this.height = item.collider_height;
		}
	}

	saveToStore(): void {
		// 아이템은 물리 시뮬레이션으로 위치가 변경되지만 DB에 저장하지 않음
		// (게임 로직에서 필요시 구현)
	}

	update(event: BeforeUpdateEvent): void {
		// 아이템은 물리 엔진이 자동으로 처리하므로 update 로직 없음
	}
}

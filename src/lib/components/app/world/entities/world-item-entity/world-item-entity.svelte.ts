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
					mask: CATEGORY_WALL | CATEGORY_TERRAIN | CATEGORY_ITEM,
				},
			}
		);

		this.angle = worldItem.rotation;
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
		const widthDiff = Math.abs(this.colliderWidth - item.collider_width);
		const heightDiff = Math.abs(this.colliderHeight - item.collider_height);
		const typeChanged = this.colliderType !== item.collider_type;

		// 크기 또는 타입이 변경되었으면 바디 재생성
		if (widthDiff > 0.01 || heightDiff > 0.01 || typeChanged) {
			const currentPosition = this.body.position;
			const currentVelocity = this.body.velocity;
			const currentAngle = this.body.angle;

			// 월드에서 기존 바디 제거
			Matter.Composite.remove(this.world.engine.world, this.body);

			// 새 바디 생성 (위치 및 크기 상태도 함께 설정됨)
			this.body = this.createBody(
				item.collider_type,
				item.collider_width,
				item.collider_height,
				currentPosition.x,
				currentPosition.y,
				{
					isStatic: false,
					collisionFilter: {
						category: CATEGORY_ITEM,
						mask: CATEGORY_WALL | CATEGORY_TERRAIN | CATEGORY_ITEM,
					},
				}
			);

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

	update(event: BeforeUpdateEvent): void {
		// 아이템은 물리 엔진이 자동으로 처리하므로 update 로직 없음
	}
}

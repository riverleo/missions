import Matter from 'matter-js';
import { get } from 'svelte/store';
import type { WorldBuildingId, Building } from '$lib/types';
import {
	CATEGORY_WALL,
	CATEGORY_TERRAIN,
	CATEGORY_BUILDING,
	CATEGORY_CHARACTER,
	TILE_SIZE,
} from '../../constants';
import { useWorldContext, useWorld } from '$lib/hooks/use-world';
import { useBuilding } from '$lib/hooks/use-building';
import { Entity } from '../entity.svelte';
import type { BeforeUpdateEvent } from '../../context';

const { Bodies } = Matter;

export class WorldBuildingEntity extends Entity {
	readonly id: WorldBuildingId;
	readonly type = 'building' as const;
	body: Matter.Body;

	protected readonly world = useWorldContext();

	constructor(id: WorldBuildingId) {
		super();
		this.id = id;

		// 스토어에서 데이터 조회
		const worldBuilding = get(useWorld().worldBuildingStore).data[id];
		const building = this.building;

		if (!worldBuilding || !building) {
			throw new Error(`Cannot create WorldBuildingEntity: missing data for id ${id}`);
		}

		// 타일 기반 크기 계산
		const width = building.tile_cols * TILE_SIZE;
		const height = building.tile_rows * TILE_SIZE;

		// 초기 크기 설정
		this.colliderWidth = width;
		this.colliderHeight = height;

		// 좌상단 타일 인덱스를 픽셀 좌표로 변환 후 건물 전체의 중심 계산
		const leftTopX = worldBuilding.tile_x * TILE_SIZE;
		const leftTopY = worldBuilding.tile_y * TILE_SIZE;
		const x = leftTopX + width / 2;
		const y = leftTopY + height / 2;

		// 바디 생성
		this.body = this.createBody(width, height, x, y);

		// 초기 위치 설정
		this.x = x;
		this.y = y;
		this.angle = 0;
	}

	private createBody(width: number, height: number, x: number, y: number): Matter.Body {
		return Bodies.rectangle(x, y, width, height, {
			label: this.id,
			isStatic: true,
			collisionFilter: {
				category: CATEGORY_BUILDING,
				mask: CATEGORY_WALL | CATEGORY_TERRAIN | CATEGORY_CHARACTER,
			},
			render: {
				visible: this.world.debug,
			},
		});
	}

	get building(): Building | undefined {
		const worldBuilding = get(useWorld().worldBuildingStore).data[this.id];
		if (!worldBuilding) return undefined;

		return get(useBuilding().store).data[worldBuilding.building_id];
	}

	sync(): void {
		const worldBuilding = get(useWorld().worldBuildingStore).data[this.id];
		const building = this.building;
		if (!worldBuilding || !building) return;

		// 새 크기 계산
		const newWidth = building.tile_cols * TILE_SIZE;
		const newHeight = building.tile_rows * TILE_SIZE;

		// 스토어 값이 실제로 변경되었는지 확인
		const widthDiff = Math.abs(this.colliderWidth - newWidth);
		const heightDiff = Math.abs(this.colliderHeight - newHeight);

		// 크기가 변경되었으면 바디 재생성
		if (widthDiff > 0.01 || heightDiff > 0.01) {
			// 좌상단 타일 인덱스를 픽셀 좌표로 변환 후 건물 전체의 중심 계산
			const leftTopX = worldBuilding.tile_x * TILE_SIZE;
			const leftTopY = worldBuilding.tile_y * TILE_SIZE;
			const x = leftTopX + newWidth / 2;
			const y = leftTopY + newHeight / 2;

			// 월드에서 기존 바디 제거
			Matter.Composite.remove(this.world.engine.world, this.body);

			// 새 바디 생성
			this.body = this.createBody(newWidth, newHeight, x, y);

			// 위치 업데이트
			this.x = x;
			this.y = y;

			// 크기 업데이트
			this.colliderWidth = newWidth;
			this.colliderHeight = newHeight;

			// 월드에 새 바디 추가
			Matter.Composite.add(this.world.engine.world, this.body);
		}
	}

	saveToStore(): void {
		// 건물은 static이므로 실제로 위치 변경 없음
		// 하지만 일관성을 위해 인터페이스 제공
	}

	update(event: BeforeUpdateEvent): void {
		// 건물은 static이므로 update 로직 없음
	}
}

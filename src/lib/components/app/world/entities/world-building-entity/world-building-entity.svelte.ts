import Matter from 'matter-js';
import { get } from 'svelte/store';
import type { WorldBuildingId, Building, WorldId } from '$lib/types';
import { CATEGORY_BUILDING, TILE_SIZE } from '../../constants';
import { useWorld } from '$lib/hooks/use-world';
import { useBuilding } from '$lib/hooks/use-building';
import { Entity } from '../entity.svelte';
import type { BeforeUpdateEvent } from '../../context';

export class WorldBuildingEntity extends Entity {
	readonly id: WorldBuildingId;
	readonly type = 'building' as const;
	body: Matter.Body;

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

		// 좌상단 타일 인덱스를 픽셀 좌표로 변환 후 건물 전체의 중심 계산
		const leftTopX = worldBuilding.tile_x * TILE_SIZE;
		const leftTopY = worldBuilding.tile_y * TILE_SIZE;
		const x = leftTopX + width / 2;
		const y = leftTopY + height / 2;

		// 바디 생성 (collider 및 위치 상태도 함께 설정됨)
		this.body = this.createBody('rectangle', width, height, x, y, {
			isStatic: true,
			collisionFilter: {
				category: CATEGORY_BUILDING,
				mask: 0, // 아무것과도 충돌하지 않음
			},
		});
	}

	get worldId(): WorldId {
		const worldBuilding = get(useWorld().worldBuildingStore).data[this.id];
		if (!worldBuilding) throw new Error(`WorldBuilding not found: ${this.id}`);
		return worldBuilding.world_id;
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
			this.removeFromWorld();

			// 새 바디 생성 (위치 및 크기 상태도 함께 설정됨)
			this.body = this.createBody('rectangle', newWidth, newHeight, x, y, {
				isStatic: true,
				collisionFilter: {
					category: CATEGORY_BUILDING,
					mask: 0, // 아무것과도 충돌하지 않음
				},
			});

			// 월드에 새 바디 추가
			this.addToWorld();
		}
	}

	saveToStore(): void {
		// 건물은 static이므로 실제로 위치 변경 없음
		// 하지만 일관성을 위해 인터페이스 제공
	}

	update(_: BeforeUpdateEvent): void {
		// 건물은 static이므로 update 로직 없음
	}
}

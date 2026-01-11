import Matter from 'matter-js';
import { get } from 'svelte/store';
import type { WorldBuildingId, Building, WorldId } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { CATEGORY_BUILDING, CATEGORY_TILE, CELL_SIZE } from '$lib/constants';
import { useWorld } from '$lib/hooks/use-world';
import { useBuilding } from '$lib/hooks/use-building';
import { Entity } from '../entity.svelte';
import type { BeforeUpdateEvent } from '../../context';

export class WorldBuildingEntity extends Entity {
	readonly type = 'building' as const;
	body: Matter.Body;

	override get instanceId(): WorldBuildingId {
		return EntityIdUtils.instanceId<WorldBuildingId>(this.id);
	}

	constructor(worldId: WorldId, worldBuildingId: WorldBuildingId) {
		super('building', worldId, worldBuildingId);

		// 스토어에서 데이터 조회
		const worldBuilding = get(useWorld().worldBuildingStore).data[worldBuildingId];
		const building = this.building;

		if (!worldBuilding || !building) {
			throw new Error(`Cannot create WorldBuildingEntity: missing data for id ${worldBuildingId}`);
		}

		// 타일 기반 크기 계산
		const width = building.cell_cols * CELL_SIZE;
		const height = building.cell_rows * CELL_SIZE;

		// 좌상단 타일 인덱스를 픽셀 좌표로 변환 후 건물 전체의 중심 계산
		const leftTopX = worldBuilding.cell_x * CELL_SIZE;
		const leftTopY = worldBuilding.cell_y * CELL_SIZE;
		const x = leftTopX + width / 2;
		const y = leftTopY + height / 2;

		// 바디 생성 (collider 및 위치 상태도 함께 설정됨)
		this.body = this.createBody('rectangle', width, height, x, y, {
			isStatic: true,
			collisionFilter: {
				category: CATEGORY_BUILDING,
				mask: CATEGORY_TILE, // 타일과 겹칠 수 없음
			},
		});
	}

	get building(): Building | undefined {
		const worldBuilding = get(useWorld().worldBuildingStore).data[this.instanceId];
		if (!worldBuilding) return undefined;

		return get(useBuilding().store).data[worldBuilding.building_id];
	}

	save(): void {
		// 건물은 static이므로 위치가 변경되지 않음
	}

	update(_: BeforeUpdateEvent): void {
		// 건물은 static이므로 update 로직 없음
	}
}

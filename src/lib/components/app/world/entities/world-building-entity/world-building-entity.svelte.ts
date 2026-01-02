import Matter from 'matter-js';
import { get } from 'svelte/store';
import type { WorldBuildingId, Building } from '$lib/types';
import {
	CATEGORY_WALL,
	CATEGORY_TERRAIN,
	CATEGORY_BUILDING,
	CATEGORY_CHARACTER,
	DEBUG_BUILDING_FILL_STYLE,
	TILE_SIZE,
} from '../../constants';
import { useWorldContext, useWorld } from '$lib/hooks/use-world';
import { useBuilding } from '$lib/hooks/use-building';
import { Entity } from '../entity.svelte';

const { Bodies, Composite } = Matter;

export class WorldBuildingEntity extends Entity {
	readonly id: WorldBuildingId;
	readonly body: Matter.Body;
	readonly size: { width: number; height: number };

	protected readonly world = useWorldContext();
	protected get debugFillStyle(): string {
		return DEBUG_BUILDING_FILL_STYLE;
	}

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
		this.size = { width, height };

		// 타일 좌표를 픽셀 좌표로 변환 (중앙 기준)
		const x = worldBuilding.tile_x * TILE_SIZE + TILE_SIZE / 2;
		const y = worldBuilding.tile_y * TILE_SIZE + TILE_SIZE / 2;

		// 사각형 static 바디 생성
		this.body = Bodies.rectangle(x, y, width, height, {
			label: id,
			isStatic: true,
			collisionFilter: {
				category: CATEGORY_BUILDING,
				mask: CATEGORY_WALL | CATEGORY_TERRAIN | CATEGORY_CHARACTER,
			},
			render: this.world.debug
				? { visible: true, fillStyle: DEBUG_BUILDING_FILL_STYLE }
				: { visible: false },
		});

		// 초기 위치 설정
		this.x = x;
		this.y = y;
		this.angle = 0;
	}

	get building(): Building | undefined {
		const worldBuilding = get(useWorld().worldBuildingStore).data[this.id];
		if (!worldBuilding) return undefined;

		return get(useBuilding().store).data[worldBuilding.building_id];
	}

	saveToStore(): void {
		// 건물은 static이므로 실제로 위치 변경 없음
		// 하지만 일관성을 위해 인터페이스 제공
	}
}

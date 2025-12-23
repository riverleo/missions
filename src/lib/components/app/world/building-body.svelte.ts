import Matter from 'matter-js';
import type { WorldBuilding, Building } from '$lib/types';
import {
	CATEGORY_WALL,
	CATEGORY_TERRAIN,
	CATEGORY_BUILDING,
	CATEGORY_CHARACTER,
	DEBUG_BUILDING_FILL_STYLE,
	TILE_SIZE,
} from './constants';

const { Bodies, Composite } = Matter;

export interface BodyPosition {
	x: number;
	y: number;
	angle: number;
}

export class BuildingBody {
	readonly id: string;
	readonly body: Matter.Body;
	readonly size: { width: number; height: number };

	position = $state<BodyPosition>({ x: 0, y: 0, angle: 0 });

	constructor(worldBuilding: WorldBuilding, building: Building, debug: boolean) {
		this.id = worldBuilding.id;

		// 타일 기반 크기 계산
		const width = building.tile_cols * TILE_SIZE;
		const height = building.tile_rows * TILE_SIZE;
		this.size = { width, height };

		// 타일 좌표를 픽셀 좌표로 변환 (중앙 기준)
		const x = worldBuilding.tile_x * TILE_SIZE + TILE_SIZE / 2;
		const y = worldBuilding.tile_y * TILE_SIZE + TILE_SIZE / 2;

		// 사각형 static 바디 생성
		this.body = Bodies.rectangle(x, y, width, height, {
			label: `building-${worldBuilding.id}`,
			isStatic: true,
			collisionFilter: {
				category: CATEGORY_BUILDING,
				mask: CATEGORY_WALL | CATEGORY_TERRAIN | CATEGORY_CHARACTER,
			},
			render: debug ? { visible: true, fillStyle: DEBUG_BUILDING_FILL_STYLE } : { visible: false },
		});

		// 초기 위치 설정
		this.position = { x, y, angle: 0 };
	}

	updatePosition(): void {
		// static body이므로 위치 업데이트 불필요
		// 하지만 인터페이스 일관성을 위해 유지
		this.position = {
			x: this.body.position.x,
			y: this.body.position.y,
			angle: this.body.angle,
		};
	}

	setDebug(debug: boolean): void {
		this.body.render.visible = debug;
		if (debug) {
			this.body.render.fillStyle = DEBUG_BUILDING_FILL_STYLE;
		}
	}

	addToWorld(matterWorld: Matter.World): void {
		Composite.add(matterWorld, this.body);
	}

	removeFromWorld(matterWorld: Matter.World): void {
		Composite.remove(matterWorld, this.body);
	}
}

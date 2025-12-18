import Matter from 'matter-js';
import type { WorldBuilding } from '$lib/types';
import { atlases } from '$lib/components/app/sprite-animator';
import {
	BUILDING_RESOLUTION,
	DEFAULT_BUILDING_SIZE,
	CATEGORY_WALL,
	CATEGORY_TERRAIN,
	CATEGORY_BUILDING,
	DEBUG_BUILDING_FILL_STYLE,
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

	constructor(worldBuilding: WorldBuilding, debug: boolean) {
		this.id = worldBuilding.id;
		this.size = this.getBodySize(worldBuilding);

		// 월드 좌표 사용 (y는 바닥 위치 기준이므로 바디 중심은 높이의 절반만큼 위로)
		const bodyX = worldBuilding.x;
		const bodyY = worldBuilding.y - this.size.height / 2;

		this.body = Bodies.rectangle(bodyX, bodyY, this.size.width, this.size.height, {
			label: `building-${worldBuilding.id}`,
			restitution: 0.1,
			friction: 0.8,
			inertia: Infinity, // 회전 방지
			collisionFilter: {
				category: CATEGORY_BUILDING,
				mask: CATEGORY_WALL | CATEGORY_TERRAIN | CATEGORY_BUILDING,
			},
			render: debug ? { visible: true, fillStyle: DEBUG_BUILDING_FILL_STYLE } : { visible: false },
		});

		// 초기 위치 설정
		this.position = { x: worldBuilding.x, y: worldBuilding.y, angle: 0 };
	}

	private getBodySize(worldBuilding: WorldBuilding): { width: number; height: number } {
		const idleState = worldBuilding.building.building_states.find((s) => s.type === 'idle');
		if (!idleState?.atlas_name) {
			return { width: DEFAULT_BUILDING_SIZE, height: DEFAULT_BUILDING_SIZE };
		}

		const metadata = atlases[idleState.atlas_name];
		if (!metadata) {
			return { width: DEFAULT_BUILDING_SIZE, height: DEFAULT_BUILDING_SIZE };
		}

		return {
			width: metadata.frameWidth / BUILDING_RESOLUTION,
			height: metadata.frameHeight / BUILDING_RESOLUTION,
		};
	}

	updatePosition(): void {
		const halfHeight = this.size.height / 2;
		// 바디 중심에서 바닥 위치(하단)로 변환 (월드 좌표)
		this.position = {
			x: this.body.position.x,
			y: this.body.position.y + halfHeight,
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

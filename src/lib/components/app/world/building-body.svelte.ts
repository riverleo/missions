import Matter from 'matter-js';
import type { WorldBuilding } from '$lib/types';
import {
	CATEGORY_WALL,
	CATEGORY_TERRAIN,
	CATEGORY_BUILDING,
	DEBUG_BUILDING_FILL_STYLE,
} from './constants';

const { Bodies, Body, Composite } = Matter;

function createEllipseVertices(
	cx: number,
	cy: number,
	rx: number,
	ry: number,
	segments: number = 24
): Matter.Vector[] {
	const vertices: Matter.Vector[] = [];
	for (let i = 0; i < segments; i++) {
		const angle = (i / segments) * Math.PI * 2;
		vertices.push({
			x: cx + rx * Math.cos(angle),
			y: cy + ry * Math.sin(angle),
		});
	}
	return vertices;
}

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
		this.size = {
			width: worldBuilding.building.width,
			height: worldBuilding.building.height,
		};

		// 타원형 바디 생성
		const rx = this.size.width / 2;
		const ry = this.size.height / 2;
		const vertices = createEllipseVertices(0, 0, rx, ry);

		this.body = Bodies.fromVertices(0, 0, [vertices], {
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

		// 바디 위치 설정 (스프라이트 중심과 동일)
		Body.setPosition(this.body, { x: worldBuilding.x, y: worldBuilding.y });

		// 초기 위치 설정
		this.position = { x: worldBuilding.x, y: worldBuilding.y, angle: 0 };
	}

	updatePosition(): void {
		// 바디 중심 위치를 그대로 사용
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

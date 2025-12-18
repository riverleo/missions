import Matter from 'matter-js';
import type { WorldCharacter } from '$lib/types';
import {
	CATEGORY_WALL,
	CATEGORY_TERRAIN,
	CATEGORY_CHARACTER,
	DEBUG_CHARACTER_FILL_STYLE,
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

export class CharacterBody {
	readonly id: string;
	readonly body: Matter.Body;
	readonly size: { width: number; height: number };

	position = $state<BodyPosition>({ x: 0, y: 0, angle: 0 });

	constructor(worldCharacter: WorldCharacter, debug: boolean) {
		this.id = worldCharacter.id;
		this.size = {
			width: worldCharacter.character.width,
			height: worldCharacter.character.height,
		};

		// 타원형 바디 생성
		const rx = this.size.width / 2;
		const ry = this.size.height / 2;
		const vertices = createEllipseVertices(0, 0, rx, ry);

		this.body = Bodies.fromVertices(0, 0, [vertices], {
			label: `character-${worldCharacter.id}`,
			restitution: 0.1,
			friction: 0.8,
			inertia: Infinity,
			collisionFilter: {
				category: CATEGORY_CHARACTER,
				mask: CATEGORY_WALL | CATEGORY_TERRAIN,
			},
			render: debug ? { visible: true, fillStyle: DEBUG_CHARACTER_FILL_STYLE } : { visible: false },
		});

		// 바디 위치 설정 (스프라이트 중심과 동일)
		Body.setPosition(this.body, { x: worldCharacter.x, y: worldCharacter.y });

		// 초기 위치 설정
		this.position = { x: worldCharacter.x, y: worldCharacter.y, angle: 0 };
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
			this.body.render.fillStyle = DEBUG_CHARACTER_FILL_STYLE;
		}
	}

	addToWorld(matterWorld: Matter.World): void {
		Composite.add(matterWorld, this.body);
	}

	removeFromWorld(matterWorld: Matter.World): void {
		Composite.remove(matterWorld, this.body);
	}
}

import Matter from 'matter-js';
import type { WorldCharacter } from '$lib/types';
import { atlases } from '$lib/components/app/sprite-animator';
import {
	CHARACTER_RESOLUTION,
	DEFAULT_CHARACTER_SIZE,
	CATEGORY_WALL,
	CATEGORY_TERRAIN,
	CATEGORY_CHARACTER,
	DEBUG_CHARACTER_FILL_STYLE,
} from './constants';

const { Bodies, Composite } = Matter;

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
		this.size = this.getBodySize(worldCharacter);

		// 월드 좌표 사용 (y는 발 위치 기준이므로 바디 중심은 높이의 절반만큼 위로)
		const bodyX = worldCharacter.x;
		const bodyY = worldCharacter.y - this.size.height / 2;

		this.body = Bodies.rectangle(bodyX, bodyY, this.size.width, this.size.height, {
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

		// 초기 위치 설정
		this.position = { x: worldCharacter.x, y: worldCharacter.y, angle: 0 };
	}

	private getBodySize(worldCharacter: WorldCharacter): { width: number; height: number } {
		const idleState = worldCharacter.character.character_states.find((s) => s.type === 'idle');
		if (!idleState?.atlas_name) {
			return { width: DEFAULT_CHARACTER_SIZE, height: DEFAULT_CHARACTER_SIZE };
		}

		const metadata = atlases[idleState.atlas_name];
		if (!metadata) {
			return { width: DEFAULT_CHARACTER_SIZE, height: DEFAULT_CHARACTER_SIZE };
		}

		return {
			width: metadata.frameWidth / CHARACTER_RESOLUTION,
			height: metadata.frameHeight / CHARACTER_RESOLUTION,
		};
	}

	updatePosition(): void {
		const halfHeight = this.size.height / 2;
		// 바디 중심에서 발 위치(하단)로 변환 (월드 좌표)
		this.position = {
			x: this.body.position.x,
			y: this.body.position.y + halfHeight,
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

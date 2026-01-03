import Matter from 'matter-js';
import type { WorldContext } from '../context';

const { Composite } = Matter;

export interface BodyPosition {
	x: number;
	y: number;
	angle: number;
}

export abstract class Entity {
	abstract readonly id: string;
	abstract readonly type: 'character' | 'building';
	abstract readonly body: Matter.Body;

	protected abstract readonly world: WorldContext;
	protected abstract get debugFillStyle(): string;

	x = $state(0);
	y = $state(0);
	angle = $state(0);

	updatePosition(): void {
		const newX = this.body.position.x;
		const newY = this.body.position.y;
		const newAngle = this.body.angle;

		// 개별 값 업데이트
		this.x = newX;
		this.y = newY;
		this.angle = newAngle;
	}

	abstract saveToStore(): void;

	setDebug(debug: boolean): void {
		this.body.render.visible = debug;
		if (debug) {
			this.body.render.fillStyle = this.debugFillStyle;
		}
	}

	addToWorld(): void {
		const allBodies = Composite.allBodies(this.world.engine.world);
		const exists = allBodies.some((body) => body.label === this.body.label);

		if (!exists) {
			Composite.add(this.world.engine.world, this.body);
		}
	}

	removeFromWorld(): void {
		const allBodies = Composite.allBodies(this.world.engine.world);
		const bodiesToRemove = allBodies.filter((body) => body.label === this.body.label);

		if (bodiesToRemove.length > 0) {
			Composite.remove(this.world.engine.world, bodiesToRemove);
		}
	}
}

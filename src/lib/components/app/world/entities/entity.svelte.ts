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
		Composite.add(this.world.engine.world, this.body);
	}

	removeFromWorld(): void {
		Composite.remove(this.world.engine.world, this.body);
	}
}

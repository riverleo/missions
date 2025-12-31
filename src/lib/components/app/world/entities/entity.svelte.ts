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

	position = $state<BodyPosition>({ x: 0, y: 0, angle: 0 });

	updatePosition(): void {
		this.position = {
			x: this.body.position.x,
			y: this.body.position.y,
			angle: this.body.angle,
		};
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

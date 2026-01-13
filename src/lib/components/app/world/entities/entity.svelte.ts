import Matter from 'matter-js';
import type { BeforeUpdateEvent, WorldContext } from '../context';
import type { EntityId, EntityInstanceId, ColliderType, WorldId, EntityType } from '$lib/types';
import { EntityIdUtils } from '$lib/utils/entity-id';

const { Composite, Bodies } = Matter;

export abstract class Entity {
	readonly id: EntityId;
	abstract readonly type: EntityType;
	abstract readonly body: any;

	readonly worldContext: WorldContext;

	x = $state(0);
	y = $state(0);
	angle = $state(0);
	colliderType = $state<ColliderType>('rectangle');
	colliderWidth = $state(0);
	colliderHeight = $state(0);

	constructor(
		worldContext: WorldContext,
		type: EntityType,
		worldId: WorldId,
		instanceId: EntityInstanceId
	) {
		this.worldContext = worldContext;
		this.id = EntityIdUtils.create(type, worldId, instanceId);
	}

	get debug(): boolean {
		return this.worldContext.debug;
	}

	get worldId(): WorldId {
		return EntityIdUtils.worldId(this.id);
	}

	get instanceId(): EntityInstanceId {
		return EntityIdUtils.instanceId(this.id);
	}

	updatePosition(): void {
		const newX = this.body.position.x;
		const newY = this.body.position.y;
		const newAngle = this.body.angle;

		// 개별 값 업데이트
		this.x = newX;
		this.y = newY;
		this.angle = newAngle;
	}

	abstract save(): void;

	// 매 프레임마다 호출되는 업데이트 로직
	abstract update(event: BeforeUpdateEvent): void;

	protected createBody(
		colliderType: ColliderType,
		colliderWidth: number,
		colliderHeight: number,
		x: number,
		y: number,
		bodyDefinition: Matter.IChamferableBodyDefinition
	): Matter.Body {
		// Entity 상태 설정
		this.colliderType = colliderType;
		this.colliderWidth = colliderWidth;
		this.colliderHeight = colliderHeight;
		this.x = x;
		this.y = y;

		const baseOptions: Matter.IChamferableBodyDefinition = {
			label: this.id,
			render: {
				visible: this.worldContext.debug,
			},
			...bodyDefinition,
		};

		if (colliderType === 'circle') {
			const radius = colliderWidth / 2;
			return Bodies.circle(x, y, radius, baseOptions);
		} else {
			return Bodies.rectangle(x, y, colliderWidth, colliderHeight, baseOptions);
		}
	}

	setDebug(debug: boolean): void {
		this.body.render.visible = debug;
	}

	addToWorld(): void {
		if (!Composite.get(this.worldContext.engine.world, this.body.id, 'body')) {
			Composite.add(this.worldContext.engine.world, this.body);
		}
		this.worldContext.entities[this.id] = this;
	}

	removeFromWorld(): void {
		Composite.remove(this.worldContext.engine.world, this.body);
		delete this.worldContext.entities[this.id];
	}
}

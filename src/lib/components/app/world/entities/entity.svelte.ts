import Matter from 'matter-js';
import type { BeforeUpdateEvent } from '../context';
import type { EntityId, EntityInstanceId, ColliderType, WorldId, EntityType } from '$lib/types';
import { useWorldContext } from '$lib/hooks/use-world';
import { EntityIdUtils } from '$lib/utils/entity-id';

const { Composite, Bodies } = Matter;

export abstract class Entity {
	readonly id: EntityId;
	abstract readonly type: EntityType;
	abstract readonly body: any;

	protected readonly world = useWorldContext();

	x = $state(0);
	y = $state(0);
	angle = $state(0);
	colliderType = $state<ColliderType>('rectangle');
	colliderWidth = $state(0);
	colliderHeight = $state(0);

	constructor(type: EntityType, worldId: WorldId, instanceId: EntityInstanceId) {
		this.id = EntityIdUtils.create(type, worldId, instanceId);
	}

	get debug(): boolean {
		return this.world.debug;
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

	// 스토어 데이터 변경사항을 엔티티에 동기화
	abstract sync(): void;

	abstract saveToStore(): void;

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
				visible: this.world.debug,
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
		if (!Composite.get(this.world.engine.world, this.body.id, 'body')) {
			Composite.add(this.world.engine.world, this.body);
		}
	}

	removeFromWorld(): void {
		Composite.remove(this.world.engine.world, this.body);
	}
}

import Matter from 'matter-js';
import { get } from 'svelte/store';
import type { WorldId, WorldCharacterId, CharacterBody } from '$lib/types';
import type { Vector } from '$lib/utils/vector';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { CATEGORY_WALL, CATEGORY_TILE, CATEGORY_CHARACTER } from '$lib/constants';
import { useWorld } from '$lib/hooks/use-world';
import { useCharacter } from '$lib/hooks/use-character';
import { useCharacterBody } from '$lib/hooks/use-character-body';
import { Entity } from '../entity.svelte';
import type { BeforeUpdateEvent, WorldContext } from '../../context';
import type { WorldCharacterEntityDirection } from './index';

const { Body, Query, Composite } = Matter;

export class WorldCharacterEntity extends Entity {
	readonly type = 'character' as const;
	body: Matter.Body;
	path: Vector[] = $state([]);
	direction: WorldCharacterEntityDirection = $state('right');

	override get instanceId(): WorldCharacterId {
		return EntityIdUtils.instanceId<WorldCharacterId>(this.id);
	}

	constructor(worldContext: WorldContext, worldId: WorldId, worldCharacterId: WorldCharacterId) {
		super(worldContext, 'character', worldId, worldCharacterId);

		// 스토어에서 데이터 조회 (초기값만)
		const worldCharacter = get(useWorld().worldCharacterStore).data[worldCharacterId];
		const characterBody = this.characterBody;

		if (!worldCharacter) {
			throw new Error(
				`Cannot create WorldCharacterEntity: missing data for id ${worldCharacterId}`
			);
		}

		// 바디 생성 (collider 및 위치 상태도 함께 설정됨)
		this.body = this.createBody(
			characterBody.collider_type,
			characterBody.collider_width,
			characterBody.collider_height,
			worldCharacter.x,
			worldCharacter.y,
			{
				restitution: 0.1,
				friction: 0.8,
				inertia: Infinity,
				collisionFilter: {
					category: CATEGORY_CHARACTER,
					mask: CATEGORY_WALL | CATEGORY_TILE,
				},
			}
		);
	}

	get characterBody(): CharacterBody {
		const worldCharacter = get(useWorld().worldCharacterStore).data[this.instanceId];
		if (!worldCharacter) throw new Error(`WorldCharacter not found for id ${this.instanceId}`);

		const characterStore = get(useCharacter().store).data;
		const characterBodyStore = get(useCharacterBody().store).data;

		const character = characterStore[worldCharacter.character_id];
		if (character === undefined)
			throw new Error(`Character not found for id ${worldCharacter.character_id}`);

		const characterBody = characterBodyStore[character.character_body_id];
		if (characterBody === undefined)
			throw new Error(`CharacterBody not found for id ${character.character_body_id}`);

		return characterBody;
	}

	override save(): void {
		const { worldCharacterStore } = useWorld();
		const store = get(worldCharacterStore);
		const worldCharacter = store.data[this.instanceId];

		if (worldCharacter) {
			worldCharacterStore.set({
				...store,
				data: {
					...store.data,
					[this.instanceId]: {
						...worldCharacter,
						x: this.x,
						y: this.y,
					},
				},
			});
		}
	}

	override update(event: BeforeUpdateEvent): void {
		if (this.path.length === 0) {
			return;
		}

		const currentPos = this.body.position;
		const targetPoint = this.path[0];
		if (!targetPoint) {
			return;
		}

		// 목표 지점까지의 거리 계산
		const dx = targetPoint.x - currentPos.x;
		const dy = targetPoint.y - currentPos.y;
		const distance = Math.sqrt(dx * dx + dy * dy);

		// 이동 방향 업데이트
		if (dx > 0) {
			this.direction = 'right';
		} else if (dx < 0) {
			this.direction = 'left';
		}

		// 도착 판정 거리
		const arrivalThreshold = 5;

		if (distance < arrivalThreshold) {
			// 목표 지점에 도착하면 path에서 제거
			this.path = this.path.slice(1);
			return;
		}

		// 진행 방향 결정 (dx > 0이면 오른쪽(1), 아니면 왼쪽(-1))
		const moveDirection = dx > 0 ? 1 : -1;

		// 앞에 장애물이 있고, 지면에 있으면 점프
		if (this.hasObstacleAhead(moveDirection) && this.isGrounded()) {
		}

		// 이동 속도 (픽셀/초)
		const speed = 150;

		// delta를 초 단위로 변환 (밀리초 → 초)
		const deltaSeconds = event.delta / 1000;

		// 이번 프레임에서 이동할 거리
		const moveDistance = speed * deltaSeconds;

		// 목표 지점까지의 거리보다 이동 거리가 크면 목표 지점으로 바로 이동
		if (moveDistance >= distance) {
			Body.setPosition(this.body, { x: targetPoint.x, y: targetPoint.y });
			this.path = this.path.slice(1);
			return;
		}

		// 정규화된 방향 벡터에 이동 거리를 곱해서 새 위치 계산
		const moveX = (dx / distance) * moveDistance;
		const moveY = (dy / distance) * moveDistance;

		Body.setPosition(this.body, {
			x: currentPos.x + moveX,
			y: currentPos.y + moveY,
		});
	}

	moveTo(targetX: number, targetY: number): void {
		const currentX = this.body.position.x;
		const currentY = this.body.position.y;

		// pathfinder로 경로 계산
		const rawPath = this.worldContext.pathfinder.findPath(currentX, currentY, targetX, targetY);

		// 경로 스무딩
		this.path = this.worldContext.pathfinder.smoothPath(rawPath);
	}

	/**
	 * 캐릭터가 지면에 닿아있는지 체크
	 */
	isGrounded(): boolean {
		const allBodies = Composite.allBodies(this.worldContext.engine.world);

		// 캐릭터 바디 바로 아래 영역 체크 (약간의 여유 포함)
		const checkHeight = 5;
		const checkY = this.body.position.y + this.colliderHeight / 2 + checkHeight / 2;

		const checkBounds = {
			min: { x: this.body.position.x - this.colliderWidth / 2, y: checkY - checkHeight / 2 },
			max: { x: this.body.position.x + this.colliderWidth / 2, y: checkY + checkHeight / 2 },
		};

		// 바운드 영역과 교차하는 static 바디 찾기
		const collisions = Query.region(allBodies, checkBounds);

		return collisions.some(
			(body) => body.isStatic && body !== this.body && body.id !== this.body.id
		);
	}

	/**
	 * 진행 방향에 장애물이 있는지 체크
	 */
	hasObstacleAhead(direction: number): boolean {
		const allBodies = Composite.allBodies(this.worldContext.engine.world);

		// 진행 방향으로 약간 앞쪽 영역 체크
		const checkDistance = 20;
		const checkWidth = this.colliderWidth;
		const checkHeight = this.colliderHeight;

		const checkX = this.body.position.x + direction * (this.colliderWidth / 2 + checkDistance / 2);
		const checkY = this.body.position.y;

		const checkBounds = {
			min: { x: checkX - checkWidth / 2, y: checkY - checkHeight / 2 },
			max: { x: checkX + checkWidth / 2, y: checkY + checkHeight / 2 },
		};

		// 바운드 영역과 교차하는 static 바디 찾기
		const collisions = Query.region(allBodies, checkBounds);

		return collisions.some(
			(body) => body.isStatic && body !== this.body && body.id !== this.body.id
		);
	}

	/**
	 * 점프 (지면에 있을 때만 가능)
	 */
	jump(): void {
		if (!this.isGrounded()) {
			return;
		}

		// 위쪽으로 속도 적용
		const jumpForce = -10;
		Body.setVelocity(this.body, {
			x: this.body.velocity.x,
			y: jumpForce,
		});
	}
}

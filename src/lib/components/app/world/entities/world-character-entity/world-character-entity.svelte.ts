import Matter from 'matter-js';
import { get } from 'svelte/store';
import type { WorldCharacterId, CharacterBody, WorldId } from '$lib/types';
import { CATEGORY_WALL, CATEGORY_TERRAIN, CATEGORY_CHARACTER } from '../../constants';
import { useWorld } from '$lib/hooks/use-world';
import { useCharacter } from '$lib/hooks/use-character';
import { useCharacterBody } from '$lib/hooks/use-character-body';
import { Entity } from '../entity.svelte';
import type { BeforeUpdateEvent } from '../../context';
import type { PathPoint } from '../../pathfinder';
import type { WorldCharacterEntityDirection } from './index';

const { Body } = Matter;

export class WorldCharacterEntity extends Entity {
	readonly id: WorldCharacterId;
	readonly type = 'character' as const;
	body: Matter.Body;
	path: PathPoint[] = $state([]);
	direction: WorldCharacterEntityDirection = $state('right');

	constructor(id: WorldCharacterId) {
		super();
		this.id = id;

		// 스토어에서 데이터 조회 (초기값만)
		const worldCharacter = get(useWorld().worldCharacterStore).data[id];
		const characterBody = this.characterBody;

		if (!worldCharacter || !characterBody) {
			throw new Error(`Cannot create WorldCharacterEntity: missing data for id ${id}`);
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
					mask: CATEGORY_WALL | CATEGORY_TERRAIN,
				},
			}
		);
	}

	get worldId(): WorldId {
		const worldCharacter = get(useWorld().worldCharacterStore).data[this.id];
		if (!worldCharacter) throw new Error(`WorldCharacter not found: ${this.id}`);
		return worldCharacter.world_id;
	}

	get characterBody(): CharacterBody | undefined {
		const worldCharacter = get(useWorld().worldCharacterStore).data[this.id];
		if (!worldCharacter) return undefined;

		const characterStore = get(useCharacter().store).data;
		const characterBodyStore = get(useCharacterBody().store).data;
		const character = characterStore[worldCharacter.character_id];

		return character ? characterBodyStore[character.character_body_id] : undefined;
	}

	override sync(): void {
		const characterBody = this.characterBody;
		if (!characterBody) return;

		// 스토어 값이 실제로 변경되었는지 확인
		const widthDiff = Math.abs(this.colliderWidth - characterBody.collider_width);
		const heightDiff = Math.abs(this.colliderHeight - characterBody.collider_height);
		const typeChanged = this.colliderType !== characterBody.collider_type;

		// 크기 또는 타입이 변경되었으면 바디 재생성
		if (widthDiff > 0.01 || heightDiff > 0.01 || typeChanged) {
			const currentPosition = this.body.position;
			const currentVelocity = this.body.velocity;
			const currentAngle = this.body.angle;

			// 월드에서 기존 바디 제거
			this.removeFromWorld();

			// 새 바디 생성
			this.body = this.createBody(
				characterBody.collider_type,
				characterBody.collider_width,
				characterBody.collider_height,
				currentPosition.x,
				currentPosition.y,
				{
					restitution: 0.1,
					friction: 0.8,
					inertia: Infinity,
					collisionFilter: {
						category: CATEGORY_CHARACTER,
						mask: CATEGORY_WALL | CATEGORY_TERRAIN,
					},
				}
			);

			// 속도/각도 복원
			Body.setVelocity(this.body, currentVelocity);
			Body.setAngle(this.body, currentAngle);

			this.addToWorld();
		}
	}

	override saveToStore(): void {
		// 스토어에 현재 위치 저장 (수동 호출)
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

		// 이동 속도 (픽셀/초)
		const speed = 50;

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
		const rawPath = this.world.pathfinder.findPath(currentX, currentY, targetX, targetY);

		// 경로 스무딩
		this.path = this.world.pathfinder.smoothPath(rawPath);
	}
}

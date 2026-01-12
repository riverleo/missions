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

const { Body } = Matter;

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
			// path가 없으면 dynamic으로 전환 (중력 적용)
			Body.setStatic(this.body, false);
			return;
		}

		// path가 있으면 static으로 전환 (path 기반 이동)
		Body.setStatic(this.body, true);

		const currentPos = this.body.position;
		const targetPoint = this.path[0];
		if (!targetPoint) {
			return;
		}

		// 목표 지점까지의 거리 계산
		const dx = targetPoint.x - currentPos.x;
		const dy = targetPoint.y - currentPos.y;

		// 이동 방향 업데이트
		if (dx > 0) {
			this.direction = 'right';
		} else if (dx < 0) {
			this.direction = 'left';
		}

		// 도착 판정 거리 (X축 위주)
		const arrivalThreshold = 5;

		if (Math.abs(dx) < arrivalThreshold) {
			// 목표 지점에 도착하면 path에서 제거
			this.path = this.path.slice(1);
			return;
		}

		// 이동 속도 (픽셀/초)
		const speed = 200;

		// delta를 초 단위로 변환 (밀리초 → 초)
		const deltaSeconds = event.delta / 1000;

		// 이번 프레임에서 이동할 거리
		const moveDistance = speed * deltaSeconds;

		// Y축 차이가 아주 작으면 무시 (미세한 떨림 방지)
		const yThreshold = 2;
		const shouldMoveY = Math.abs(dy) > yThreshold;

		// X축만 또는 X, Y 모두 이동
		const distance = shouldMoveY ? Math.sqrt(dx * dx + dy * dy) : Math.abs(dx);

		// 목표 지점까지의 거리보다 이동 거리가 크면 목표 지점으로 바로 이동
		if (moveDistance >= distance) {
			Body.setPosition(this.body, {
				x: targetPoint.x,
				y: shouldMoveY ? targetPoint.y : currentPos.y,
			});
			this.path = this.path.slice(1);
			return;
		}

		// 정규화된 방향 벡터에 이동 거리를 곱해서 새 위치 계산
		const moveX = (dx / distance) * moveDistance;
		const moveY = shouldMoveY ? (dy / distance) * moveDistance : 0;

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
}

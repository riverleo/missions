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

		// 도착 판정 거리
		const arrivalThreshold = 5;

		if (Math.abs(dx) < arrivalThreshold && Math.abs(dy) < arrivalThreshold) {
			// 목표 지점에 도착하면 path에서 제거
			this.path = this.path.slice(1);
			return;
		}

		// delta를 초 단위로 변환 (밀리초 → 초)
		const deltaSeconds = event.delta / 1000;

		// 속도 설정
		const horizontalSpeed = 200; // 좌우 이동 속도
		const upSpeed = 100; // 위로 올라가는 속도 (느림)
		const downSpeed = 300; // 아래로 내려가는 속도 (빠름)

		let newX = currentPos.x;
		let newY = currentPos.y;

		// X축 우선 이동
		if (Math.abs(dx) > arrivalThreshold) {
			const moveDistance = horizontalSpeed * deltaSeconds;
			if (Math.abs(dx) <= moveDistance) {
				newX = targetPoint.x;
			} else {
				newX = currentPos.x + Math.sign(dx) * moveDistance;
			}
			// X축 이동 중에는 Y축 고정
			newY = currentPos.y;
		}
		// X축 이동이 완료되면 Y축 이동
		else if (Math.abs(dy) > arrivalThreshold) {
			// Y축 이동 중에는 X축을 목표 위치로 고정 (떨림 방지)
			newX = targetPoint.x;

			const speed = dy < 0 ? upSpeed : downSpeed;
			const moveDistance = speed * deltaSeconds;
			if (Math.abs(dy) <= moveDistance) {
				newY = targetPoint.y;
			} else {
				newY = currentPos.y + Math.sign(dy) * moveDistance;
			}
		}

		Body.setPosition(this.body, {
			x: newX,
			y: newY,
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

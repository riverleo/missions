import Matter from 'matter-js';
import type { BeforeUpdateEvent } from '../../context';
import type { WorldCharacterEntity } from './world-character-entity.svelte';
import { vectorUtils } from '$lib/utils/vector';

const { Body } = Matter;

/**
 * 경로를 따라 이동
 */
export function move(entity: WorldCharacterEntity, event: BeforeUpdateEvent): void {
	if (entity.path.length === 0) {
		// path가 없으면 dynamic으로 전환 (중력 적용)
		Body.setStatic(entity.body, false);
		return;
	}

	// path가 있으면 static으로 전환 (path 기반 이동)
	Body.setStatic(entity.body, true);

	const targetPoint = entity.path[0];
	if (!targetPoint) {
		return;
	}

	const currentVector = entity.body.position;
	const delta = event.delta;
	const deltaSeconds = delta / 1000;

	// 목표 지점까지의 거리 계산
	const dx = targetPoint.x - currentVector.x;
	const dy = targetPoint.y - currentVector.y;

	// 이동 방향 업데이트
	if (dx > 0) {
		entity.direction = 'right';
	} else if (dx < 0) {
		entity.direction = 'left';
	}

	// 도착 판정 거리
	const arrivalThreshold = 5;

	if (Math.abs(dx) < arrivalThreshold && Math.abs(dy) < arrivalThreshold) {
		entity.path = entity.path.slice(1);
		return;
	}

	// 속도 설정
	const speed = 200;

	let newX = currentVector.x;
	let newY = currentVector.y;

	// X축 우선 이동
	if (Math.abs(dx) > arrivalThreshold) {
		const moveDistance = speed * deltaSeconds;
		if (Math.abs(dx) <= moveDistance) {
			newX = targetPoint.x;
		} else {
			newX = currentVector.x + Math.sign(dx) * moveDistance;
		}
		// X축 이동 중에는 Y축 고정
		newY = currentVector.y;
	}
	// X축 이동이 완료되면 Y축 이동
	else if (Math.abs(dy) > arrivalThreshold) {
		newX = targetPoint.x;

		const moveDistance = speed * deltaSeconds;
		if (Math.abs(dy) <= moveDistance) {
			newY = targetPoint.y;
		} else {
			newY = currentVector.y + Math.sign(dy) * moveDistance;
		}
	}

	Body.setPosition(entity.body, { x: newX, y: newY });
}

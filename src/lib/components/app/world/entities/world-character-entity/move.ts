import Matter from 'matter-js';
import type { BeforeUpdateEvent } from '../../context';
import type { WorldCharacterEntity } from './world-character-entity.svelte';

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

	// 현재 위치가 점프존인지 확인
	const cell = entity.worldContext.pathfinder.getCellFromVector(currentVector);
	const jumpable = cell?.jumpable ?? false;

	// 점프존에 진입했을 때, 4-5번째 뒤의 목표가 위쪽인지 확인
	if (jumpable && !entity.wasJumpable) {
		// 4-5번째 뒤의 waypoint 확인 (없으면 마지막 waypoint)
		const lookAheadIndex = Math.min(4, entity.path.length - 1);
		const futureTarget = entity.path[lookAheadIndex];
		if (futureTarget && futureTarget.y < currentVector.y) {
			// 미래 목표가 위쪽이면 대기
			entity.jumpDelay = 500; // 500ms 대기
		}
	}
	entity.wasJumpable = jumpable;

	// 목표 지점까지의 거리 계산
	const dx = targetPoint.x - currentVector.x;
	const dy = targetPoint.y - currentVector.y;

	// 점프 대기 중이면 움직이지 않고 시간만 감소
	if (entity.jumpDelay > 0) {
		entity.jumpDelay = Math.max(0, entity.jumpDelay - delta);
		return;
	}

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

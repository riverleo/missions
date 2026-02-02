import Matter from 'matter-js';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type { BeforeUpdateEvent } from '../../../context';

const { Body } = Matter;

/**
 * 경로를 따라 이동
 */
export default function update(
	this: WorldCharacterEntityBehavior,
	event: BeforeUpdateEvent
): void {
	if (this.path.length === 0) {
		// path가 없으면 dynamic으로 전환 (중력 적용)
		Body.setStatic(this.worldCharacterEntity.body, false);
		return;
	}

	// path가 있으면 static으로 전환 (path 기반 이동)
	Body.setStatic(this.worldCharacterEntity.body, true);

	const targetPoint = this.path[0];
	if (!targetPoint) {
		return;
	}

	const currentVector = this.worldCharacterEntity.body.position;
	const delta = event.delta;
	const deltaSeconds = delta / 1000;

	// 목표 지점까지의 거리 계산
	const dx = targetPoint.x - currentVector.x;
	const dy = targetPoint.y - currentVector.y;

	// 이동 방향 업데이트
	if (dx > 0) {
		this.direction = 'right';
	} else if (dx < 0) {
		this.direction = 'left';
	}

	// 도착 판정 거리
	const arrivalThreshold = 5;

	if (Math.abs(dx) < arrivalThreshold && Math.abs(dy) < arrivalThreshold) {
		this.path = this.path.slice(1);
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

	Body.setPosition(this.worldCharacterEntity.body, { x: newX, y: newY });
}

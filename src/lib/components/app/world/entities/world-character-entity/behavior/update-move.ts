import Matter from 'matter-js';
import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type { BeforeUpdateEvent } from '../../../context';

const { Body } = Matter;

/**
 * # 경로 이동 처리
 *
 * 설정된 경로(path)를 따라 캐릭터를 이동시킵니다.
 * X축 우선 이동 방식을 사용하며, 경로가 없으면 물리 엔진에 의한 자유낙하를 적용합니다.
 *
 * @param event - 업데이트 이벤트 (delta 포함)
 *
 * ## 명세
 * - [x] 경로가 비어있으면 바디를 다이나믹으로 전환한다.
 * - [x] 경로가 있으면 바디를 스태틱으로 전환한다.
 * - [x] 경로의 첫 번째 지점을 목표로 설정한다.
 * - [x] 목표까지의 거리를 계산한다.
 * - [x] arrivalThreshold(5px) 이내면 경로에서 제거한다.
 * - [x] X축을 우선으로 이동한다.
 * - [x] X축 이동 중에는 Y축을 고정한다.
 * - [x] X축 완료 후 Y축으로 이동한다.
 * - [x] speed(200) * deltaSeconds 만큼 이동한다.
 * - [x] 목표 지점 오버슈팅을 방지한다.
 */
export default function updateMove(
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

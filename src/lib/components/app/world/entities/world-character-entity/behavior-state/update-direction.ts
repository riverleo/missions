import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';
import type Matter from 'matter-js';

/**
 * # 이동 방향 업데이트
 *
 * 경로(path)의 방향 전환 지점을 찾아 현재 세그먼트의 끝점을 기준으로
 * 캐릭터의 이동 방향을 업데이트합니다.
 *
 * @returns {Vector} 기준 지점
 *
 * ## 명세
 * - [x] 경로가 비어있으면 아무것도 하지 않는다.
 * - [x] 경로에서 방향이 바뀌는 첫 지점을 기준으로 한다.
 * - [x] 경로에서 y축으로 이동하는 경우 y축 이동이 끝나고 x축 방향이 처음 결정되는 지점을 기준으로 한다.
 * - [x] 방향 전환 지점이 없으면 경로의 마지막 지점을 기준으로 한다.
 * - [x] 기준 지점과 현재 위치의 x 좌표의 차이를 비교하여 방향을 결정한다.
 * - [x] 차이가 threshold(5px) 이내면 방향을 변경하지 않는다.
 */
export default function updateDirection(
	this: WorldCharacterEntityBehavior
): Matter.Vector | undefined {
	if (this.path.length === 0) return undefined;

	const currentX = this.worldCharacterEntity.body.position.x;

	// path에서 방향이 바뀌는 첫 지점 찾기
	let segmentEndIndex = 0;

	if (this.path.length > 1) {
		// 초기 방향 결정 (y축만 이동하는 경우 x축 방향이 처음 나타나는 지점 찾기)
		let initialDirection: 'left' | 'right' | null = null;
		let initialDirectionIndex = 0;

		for (let i = 0; i < this.path.length - 1; i++) {
			const dx = this.path[i + 1]!.x - this.path[i]!.x;
			if (dx !== 0) {
				initialDirection = dx > 0 ? 'right' : 'left';
				initialDirectionIndex = i;
				break;
			}
		}

		// 초기 방향을 찾은 경우, 방향이 바뀌는 지점 찾기
		if (initialDirection) {
			for (let i = initialDirectionIndex + 1; i < this.path.length - 1; i++) {
				const dx = this.path[i + 1]!.x - this.path[i]!.x;
				const currentDirection = dx > 0 ? 'right' : dx < 0 ? 'left' : null;

				// 방향이 바뀌면 그 전까지가 현재 세그먼트
				if (currentDirection && currentDirection !== initialDirection) {
					segmentEndIndex = i;
					break;
				}
			}
		}

		// 방향 전환 지점을 못 찾으면
		if (segmentEndIndex === 0) {
			// y축 이동 후 x축 방향이 시작된 경우, 첫 번째 x축 세그먼트의 끝점
			if (initialDirectionIndex > 0 && initialDirection) {
				segmentEndIndex = initialDirectionIndex + 1;
			} else {
				// 그 외의 경우 path의 끝
				segmentEndIndex = this.path.length - 1;
			}
		}
	}

	// 현재 세그먼트의 마지막 포인트로 방향 결정
	const segmentEnd = this.path[segmentEndIndex];
	if (segmentEnd) {
		const dx = segmentEnd.x - currentX;
		const threshold = 5;
		if (Math.abs(dx) > threshold) {
			this.direction = dx > 0 ? 'right' : 'left';
		}
	}

	return segmentEnd;
}

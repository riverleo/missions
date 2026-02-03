import type { WorldCharacterEntityBehavior } from './world-character-entity-behavior.svelte';

/**
 * 이동 방향 업데이트 (path 세그먼트의 끝점 기준)
 *
 * path를 방향이 바뀌는 지점에서 쪼개고,
 * 현재 세그먼트의 마지막 포인트를 기준으로 방향 설정
 */
export default function updateDirection(this: WorldCharacterEntityBehavior): void {
	if (this.path.length === 0) return;

	const currentX = this.worldCharacterEntity.body.position.x;

	// path에서 방향이 바뀌는 첫 지점 찾기
	let segmentEndIndex = 0;

	if (this.path.length > 1) {
		// 첫 두 점으로 초기 방향 결정
		const firstDx = this.path[1]!.x - this.path[0]!.x;
		const initialDirection = firstDx > 0 ? 'right' : firstDx < 0 ? 'left' : null;

		// 방향이 바뀌는 지점 찾기
		for (let i = 1; i < this.path.length - 1; i++) {
			const dx = this.path[i + 1]!.x - this.path[i]!.x;
			const currentDirection = dx > 0 ? 'right' : dx < 0 ? 'left' : null;

			// 방향이 바뀌면 그 전까지가 현재 세그먼트
			if (currentDirection && initialDirection && currentDirection !== initialDirection) {
				segmentEndIndex = i;
				break;
			}
		}

		// 방향 전환 지점을 못 찾으면 path의 끝
		if (segmentEndIndex === 0) {
			segmentEndIndex = this.path.length - 1;
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
}

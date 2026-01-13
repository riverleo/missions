import { BOUNDARY_THICKNESS } from '$lib/constants';
import type { Pathfinder } from './pathfinder';

/**
 * 그리드 초기화 및 바닥(boundary bottom) 위로 2번째 노드를 walkable로 설정
 */
export function initializeWalkable(pathfinder: Pathfinder): void {
	// 모든 셀을 unwalkable로 초기화
	for (let y = 0; y < pathfinder.rows; y++) {
		for (let x = 0; x < pathfinder.cols; x++) {
			pathfinder.grid.setWalkableAt(x, y, false);
		}
	}

	if (!pathfinder.worldContext.boundaries) {
		throw new Error('Cannot initialize walkable: boundaries not found');
	}

	// 바닥의 상단 y 좌표 (중심 - 높이의 절반)
	const bottomTopY =
		pathfinder.worldContext.boundaries.bottom.position.y - BOUNDARY_THICKNESS / 2;
	const bottomTopCellY = pathfinder.pixelToCellIndex(bottomTopY);

	// 바닥 위로 2번째 셀
	for (let x = 0; x < pathfinder.cols; x++) {
		pathfinder.grid.setWalkableAt(x, bottomTopCellY - 2, true);
	}
}

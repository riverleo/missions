import { BOUNDARY_THICKNESS, TILE_CELL_RATIO, CELL_SIZE } from '$lib/constants';
import type { WorldTileEntity } from '../entities/world-tile-entity';
import type { Pathfinder } from './pathfinder.svelte';
import { vectorUtils } from '$lib/utils/vector';

/**
 * 그리드 초기화 및 바닥(boundary bottom) 위로 2번째 노드를 walkable로 설정
 */
export function initializeWalkable(pathfinder: Pathfinder) {
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
	const bottomTopY = pathfinder.worldContext.boundaries.bottom.position.y - BOUNDARY_THICKNESS / 2;
	const bottomTopRow = vectorUtils.pixelToCellIndex(bottomTopY);

	// 바닥 위로 2번째 셀
	for (let x = 0; x < pathfinder.cols; x++) {
		pathfinder.grid.setWalkableAt(x, bottomTopRow - 2, true);
	}
}

/**
 * 모든 타일 기반으로 walkable 영역 설정 및 점프존 생성
 */
export function setWalkable(pathfinder: Pathfinder) {
	const tileEntities = Object.values(pathfinder.worldContext.entities).filter(
		(entity): entity is WorldTileEntity => entity.type === 'tile'
	);

	// 타일 위치 맵 생성 (빠른 조회용)
	const tilePositions = new Set(tileEntities.map((tile) => `${tile.tileX},${tile.tileY}`));

	for (const tile of tileEntities) {
		const cellX = tile.tileX * TILE_CELL_RATIO;
		const cellY = tile.tileY * TILE_CELL_RATIO;

		// 좌측/우측/상단/하단 인접 타일 확인
		const hasLeftTile = tilePositions.has(`${tile.tileX - 1},${tile.tileY}`);
		const hasRightTile = tilePositions.has(`${tile.tileX + 1},${tile.tileY}`);
		const hasTopTile = tilePositions.has(`${tile.tileX},${tile.tileY - 1}`);
		const hasBottomTile = tilePositions.has(`${tile.tileX},${tile.tileY + 1}`);

		// 타일 너비만큼 walkable 설정
		for (let dx = 0; dx < TILE_CELL_RATIO; dx++) {
			if (!hasTopTile) {
				pathfinder.grid.setWalkableAt(cellX + dx, cellY - 2, true);
			}

			// 좌측 끝 또는 우측 끝에만 아래 walkable 설정
			const isLeftEdge = !hasLeftTile && dx === 0;
			const isRightEdge = !hasRightTile && dx === TILE_CELL_RATIO - 1;

			if (isLeftEdge || isRightEdge) {
				// 좌우로 4칸씩 walkable 설정 (수평 타일 연결)
				if (isLeftEdge) {
					// 왼쪽으로 4칸
					for (let offset = 1; offset <= 3; offset++) {
						if (!hasTopTile) {
							pathfinder.grid.setWalkableAt(cellX + dx - offset, cellY - 2, true);
						}

						if (offset === 3) {
							pathfinder.grid.setWalkableAt(cellX + dx - offset, cellY - 1, true);
							pathfinder.grid.setWalkableAt(cellX + dx - offset, cellY, true);
							pathfinder.grid.setWalkableAt(cellX + dx - offset, cellY + 1, true);
							pathfinder.grid.setWalkableAt(cellX + dx - offset, cellY + 2, true);
							pathfinder.grid.setWalkableAt(cellX + dx - offset, cellY + 3, true);
							pathfinder.grid.setWalkableAt(cellX + dx - offset, cellY + 4, true);
						}
					}
				}
				if (isRightEdge) {
					// 오른쪽으로 4칸
					for (let offset = 1; offset <= 3; offset++) {
						if (!hasTopTile) {
							pathfinder.grid.setWalkableAt(cellX + dx + offset, cellY - 2, true);
						}

						if (offset === 3) {
							pathfinder.grid.setWalkableAt(cellX + dx + offset, cellY - 1, true);
							pathfinder.grid.setWalkableAt(cellX + dx + offset, cellY, true);
							pathfinder.grid.setWalkableAt(cellX + dx + offset, cellY + 1, true);
							pathfinder.grid.setWalkableAt(cellX + dx + offset, cellY + 2, true);
							pathfinder.grid.setWalkableAt(cellX + dx + offset, cellY + 3, true);
							pathfinder.grid.setWalkableAt(cellX + dx + offset, cellY + 4, true);
						}
					}
				}
			}
		}
	}
}

/**
 * 모든 타일이 차지하는 영역을 unwalkable로 덮어씌우기
 */
export function setTileToUnwalkable(pathfinder: Pathfinder) {
	const tileEntities = Object.values(pathfinder.worldContext.entities).filter(
		(entity): entity is WorldTileEntity => entity.type === 'tile'
	);

	for (const tile of tileEntities) {
		const cellX = tile.tileX * TILE_CELL_RATIO;
		const cellY = tile.tileY * TILE_CELL_RATIO;

		for (let dy = 0; dy < TILE_CELL_RATIO; dy++) {
			for (let dx = 0; dx < TILE_CELL_RATIO; dx++) {
				pathfinder.grid.setWalkableAt(cellX + dx, cellY + dy, false);
			}
		}
	}
}

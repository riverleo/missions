import { BOUNDARY_THICKNESS, TILE_CELL_RATIO } from '$lib/constants';
import type { WorldTileEntity } from '../entities/world-tile-entity';
import type { Pathfinder } from './pathfinder';
import type { Cell } from '$lib/types';
import { vectorUtils } from '$lib/utils/vector';

/**
 * 범위 체크 후 안전하게 setWalkableAt 호출
 */
function safeSetWalkableAt(pathfinder: Pathfinder, walkable: boolean, ...cells: Cell[]) {
	for (const cell of cells) {
		if (cell.col >= 0 && cell.col < pathfinder.cols && cell.row >= 0 && cell.row < pathfinder.rows) {
			pathfinder.grid.setWalkableAt(cell.col, cell.row, walkable);
		}
	}
}

/**
 * 모든 타일 기반으로 walkable 영역 설정
 */
function setWalkableAt(pathfinder: Pathfinder) {
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

		// 타일 너비만큼 walkable 설정
		for (let dx = 0; dx < TILE_CELL_RATIO; dx++) {
			if (!hasTopTile) {
				safeSetWalkableAt(
					pathfinder,
					true,
					vectorUtils.createCell(cellX + dx, cellY - 2)
				);
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
							safeSetWalkableAt(
								pathfinder,
								true,
								vectorUtils.createCell(cellX + dx - offset, cellY - 2)
							);
						}

						if (offset === 3) {
							const verticalCells = vectorUtils.createCells(
								cellX + dx - offset,
								cellY - 1,
								1,
								6
							);
							safeSetWalkableAt(pathfinder, true, ...verticalCells);
						}
					}
				}
				if (isRightEdge) {
					// 오른쪽으로 4칸
					for (let offset = 1; offset <= 3; offset++) {
						if (!hasTopTile) {
							safeSetWalkableAt(
								pathfinder,
								true,
								vectorUtils.createCell(cellX + dx + offset, cellY - 2)
							);
						}

						if (offset === 3) {
							const verticalCells = vectorUtils.createCells(
								cellX + dx + offset,
								cellY - 1,
								1,
								6
							);
							safeSetWalkableAt(pathfinder, true, ...verticalCells);
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
function setUnwalkableAt(pathfinder: Pathfinder) {
	const tileEntities = Object.values(pathfinder.worldContext.entities).filter(
		(entity): entity is WorldTileEntity => entity.type === 'tile'
	);

	for (const tile of tileEntities) {
		const cellX = tile.tileX * TILE_CELL_RATIO;
		const cellY = tile.tileY * TILE_CELL_RATIO;

		const cells = vectorUtils.createCells(cellX, cellY, TILE_CELL_RATIO, TILE_CELL_RATIO);
		safeSetWalkableAt(pathfinder, false, ...cells);
	}
}

/**
 * 점프존(jumpable) 영역 설정
 * - 아래에 타일이 없을 때 (!hasBottomTile), 타일 옆 3칸 떨어진 cellY + 4 위치를 jumpable로 설정
 * - 타일이 세로로 쌓여있으면 마지막(맨 아래) 타일만 jumpable 영역 생성
 */
function setJumpableAt(pathfinder: Pathfinder) {
	pathfinder.jumpableCells.clear();

	const tileEntities = Object.values(pathfinder.worldContext.entities).filter(
		(entity): entity is WorldTileEntity => entity.type === 'tile'
	);

	// 타일 위치 맵 생성 (빠른 조회용)
	const tilePositions = new Set(tileEntities.map((tile) => `${tile.tileX},${tile.tileY}`));

	for (const tile of tileEntities) {
		const cellX = tile.tileX * TILE_CELL_RATIO;
		const cellY = tile.tileY * TILE_CELL_RATIO;

		// 인접 타일 확인
		const hasLeftTile = tilePositions.has(`${tile.tileX - 1},${tile.tileY}`);
		const hasRightTile = tilePositions.has(`${tile.tileX + 1},${tile.tileY}`);
		const hasBottomTile = tilePositions.has(`${tile.tileX},${tile.tileY + 1}`);

		// 아래에 타일이 없을 때만 jumpable 설정 (마지막 타일)
		if (!hasBottomTile) {
			for (let dx = 0; dx < TILE_CELL_RATIO; dx++) {
				const isLeftEdge = !hasLeftTile && dx === 0;
				const isRightEdge = !hasRightTile && dx === TILE_CELL_RATIO - 1;

				if (isLeftEdge || isRightEdge) {
					const offset = 3;

					if (isLeftEdge) {
						// 왼쪽 3칸 떨어진 cellY + 4 위치
						const jumpCol = cellX + dx - offset;
						const jumpRow = cellY + 4;
						const cellKey = vectorUtils.createCellKey(jumpCol, jumpRow);
						pathfinder.jumpableCells.add(cellKey);
					}

					if (isRightEdge) {
						// 오른쪽 3칸 떨어진 cellY + 4 위치
						const jumpCol = cellX + dx + offset;
						const jumpRow = cellY + 4;
						const cellKey = vectorUtils.createCellKey(jumpCol, jumpRow);
						pathfinder.jumpableCells.add(cellKey);
					}
				}
			}
		}
	}
}

export const cell = {
	/**
	 * 그리드를 초기화하고 기본 walkable 셀 설정
	 */
	reset: (pathfinder: Pathfinder) => {
		// 모든 셀을 unwalkable로 초기화
		const cells = vectorUtils.createCells(0, 0, pathfinder.cols, pathfinder.rows);
		safeSetWalkableAt(pathfinder, false, ...cells);

		if (!pathfinder.worldContext.boundaries) {
			throw new Error('Cannot initialize walkable: boundaries not found');
		}

		// 바닥의 상단 y 좌표 (중심 - 높이의 절반)
		const bottomTopY =
			pathfinder.worldContext.boundaries.bottom.position.y - BOUNDARY_THICKNESS / 2;
		const bottomTopRow = vectorUtils.pixelToCellIndex(bottomTopY);

		// 바닥 위로 2번째 셀
		const bottomCells: Cell[] = [];
		for (let x = 0; x < pathfinder.cols; x++) {
			bottomCells.push(vectorUtils.createCell(x, bottomTopRow - 2));
		}
		safeSetWalkableAt(pathfinder, true, ...bottomCells);
	},

	/**
	 * 타일 엔티티들을 기반으로 walkable/unwalkable/jumpable 영역 업데이트
	 */
	update(pathfinder: Pathfinder) {
		setWalkableAt(pathfinder);
		setJumpableAt(pathfinder);
		setUnwalkableAt(pathfinder);
	},
};

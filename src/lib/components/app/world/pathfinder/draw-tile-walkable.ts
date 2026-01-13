import { TILE_CELL_RATIO } from '$lib/constants';
import type { WorldTileEntity } from '../entities/world-tile-entity';
import type { Pathfinder } from './pathfinder';

/**
 * 모든 타일 위/아래로 walkable 설정
 */
export function drawTileWalkable(pathfinder: Pathfinder): void {
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
							// 점프존 등록 (아래에 타일이 없을 때만)
							if (!hasBottomTile) {
								pathfinder.jumpZones.add(`${cellX + dx - offset},${cellY + 4}`);
							}
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
							// 점프존 등록 (아래에 타일이 없을 때만)
							if (!hasBottomTile) {
								pathfinder.jumpZones.add(`${cellX + dx + offset},${cellY + 4}`);
							}
						}
					}
				}
			}
		}
	}
}

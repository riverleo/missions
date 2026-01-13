import { TILE_CELL_RATIO } from '$lib/constants';
import type { WorldTileEntity } from '../entities/world-tile-entity';
import type { Pathfinder } from './pathfinder';

/**
 * 모든 타일이 차지하는 영역을 unwalkable로 덮어씌우기
 */
export function drawTileUnwalkable(pathfinder: Pathfinder): void {
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

import { TILE_SIZE } from './constants';

/**
 * 픽셀 좌표를 타일 인덱스로 변환
 */
export function pixelToTile(pixel: number): number {
	return Math.floor(pixel / TILE_SIZE);
}

/**
 * 타일 인덱스를 타일 중심 픽셀 좌표로 변환
 */
export function tileToCenterPixel(tile: number): number {
	return tile * TILE_SIZE + TILE_SIZE / 2;
}

/**
 * 픽셀 좌표에서 가장 가까운 타일 중심 픽셀 좌표 반환
 */
export function snapToTileCenter(pixel: number): number {
	return tileToCenterPixel(pixelToTile(pixel));
}

/**
 * 픽셀 좌표를 타일 중심 좌표로 스냅 (x, y 동시 처리)
 */
export function snapPointToTileCenter(x: number, y: number): { x: number; y: number } {
	return {
		x: snapToTileCenter(x),
		y: snapToTileCenter(y),
	};
}

/**
 * 건물 크기에 맞게 배치 중심 좌표를 스냅
 * - 홀수 타일: 타일 중심에 스냅 (건물 중심이 타일 중심과 일치)
 * - 짝수 타일: 타일 경계에 스냅 (건물 중심이 타일 경계와 일치)
 */
export function snapToBuildingCenter(pixel: number, tileCount: number): number {
	const tile = pixelToTile(pixel);

	if (tileCount % 2 === 1) {
		// 홀수: 타일 중심에 스냅
		return tileToCenterPixel(tile);
	} else {
		// 짝수: 가장 가까운 타일 경계에 스냅
		const leftBoundary = tile * TILE_SIZE;
		const rightBoundary = (tile + 1) * TILE_SIZE;
		return pixel - leftBoundary < rightBoundary - pixel ? leftBoundary : rightBoundary;
	}
}

/**
 * 마우스 위치로부터 건물의 좌상단 타일 인덱스 계산
 */
export function snapToTopLeftTile(pixel: number, tileCount: number): number {
	const centerPixel = snapToBuildingCenter(pixel, tileCount);
	return pixelToTile(centerPixel) - Math.floor(tileCount / 2);
}

/**
 * 마우스 위치로부터 건물의 좌상단 타일 인덱스 계산 (x, y 동시 처리)
 */
export function snapPointToTopLeftTile(
	x: number,
	y: number,
	cols: number,
	rows: number
): { tileX: number; tileY: number } {
	return {
		tileX: snapToTopLeftTile(x, cols),
		tileY: snapToTopLeftTile(y, rows),
	};
}

export interface TileCell {
	col: number;
	row: number;
}

/**
 * 좌상단 타일 인덱스로 건물이 차지하는 셀들 계산
 * @param tileX 건물 좌상단 X 타일 인덱스
 * @param tileY 건물 좌상단 Y 타일 인덱스
 * @param cols 건물 가로 타일 수
 * @param rows 건물 세로 타일 수
 */
export function getBuildingOccupiedCells(
	tileX: number,
	tileY: number,
	cols: number,
	rows: number
): TileCell[] {
	const cells: TileCell[] = [];

	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			cells.push({ col: tileX + col, row: tileY + row });
		}
	}

	return cells;
}

/**
 * 두 타일 셀 배열의 겹치는 셀들 반환
 */
export function getOverlappingCells(cellsA: TileCell[], cellsB: TileCell[]): TileCell[] {
	const setB = new Set(cellsB.map((c) => `${c.col},${c.row}`));
	return cellsA.filter((c) => setB.has(`${c.col},${c.row}`));
}

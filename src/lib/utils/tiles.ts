import { TILE_SIZE } from '$lib/constants';

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
export function pixelToTileCenter(pixel: number): number {
	return tileToCenterPixel(pixelToTile(pixel));
}

/**
 * 픽셀 좌표를 타일 중심 좌표로 스냅 (x, y 동시 처리)
 */
export function pointToTileCenter(x: number, y: number): { x: number; y: number } {
	return {
		x: pixelToTileCenter(x),
		y: pixelToTileCenter(y),
	};
}

/**
 * 건물 크기에 맞게 배치 중심 좌표를 스냅
 * - 홀수 타일: 타일 중심에 스냅 (건물 중심이 타일 중심과 일치)
 * - 짝수 타일: 타일 경계에 스냅 (건물 중심이 타일 경계와 일치)
 */
export function pixelToBuildingCenter(pixel: number, tileCount: number): number {
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
export function pixelToTopLeftTile(pixel: number, tileCount: number): number {
	const centerPixel = pixelToBuildingCenter(pixel, tileCount);
	return pixelToTile(centerPixel) - Math.floor(tileCount / 2);
}

/**
 * 마우스 위치로부터 건물의 좌상단 타일 인덱스 계산 (x, y 동시 처리)
 */
export function pointToTopLeftTile(
	x: number,
	y: number,
	cols: number,
	rows: number
): { tileX: number; tileY: number } {
	return {
		tileX: pixelToTopLeftTile(x, cols),
		tileY: pixelToTopLeftTile(y, rows),
	};
}

export interface TileCell {
	col: number;
	row: number;
}

/**
 * 좌상단 타일 인덱스로 건물이 차지하는 셀들 계산
 * @param cellX 건물 좌상단 X 타일 인덱스
 * @param cellY 건물 좌상단 Y 타일 인덱스
 * @param cols 건물 가로 타일 수
 * @param rows 건물 세로 타일 수
 */
export function getBuildingOccupiedCells(
	cellX: number,
	cellY: number,
	cols: number,
	rows: number
): TileCell[] {
	const cells: TileCell[] = [];

	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			cells.push({ col: cellX + col, row: cellY + row });
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

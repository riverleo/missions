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

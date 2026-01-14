import { CELL_SIZE } from '$lib/constants';
import type { Vector } from '$lib/types';

export function pixelTo(pixel: number, size: number): number {
	return Math.floor(pixel / size);
}

export function toPixel(index: number, size: number): number {
	return index * size + size / 2;
}

/**
 * 픽셀 좌표를 그리드 인덱스로 변환
 */
export function vectorXToCol(vectorX: number): number {
	return pixelTo(vectorX, CELL_SIZE);
}

/**
 * 픽셀 좌표를 그리드 인덱스로 변환
 */
export function vectorYToRow(vectorY: number): number {
	return pixelTo(vectorY, CELL_SIZE);
}

/**
 * 그리드 열 인덱스를 월드 픽셀 X 좌표(타일 중심)로 변환
 */
export function colToVectorX(col: number): number {
	return toPixel(col, CELL_SIZE);
}

/**
 * 그리드 행 인덱스를 월드 픽셀 Y 좌표(타일 중심)로 변환
 */
export function rowToVectorY(row: number): number {
	return toPixel(row, CELL_SIZE);
}

/**
 * 마우스 위치로부터 좌상단 그리드 인덱스 계산
 * - 홀수 count: 그리드 중심에 스냅
 * - 짝수 count: 그리드 경계에 스냅
 */
export function pixelToTopLeft(pixel: number, count: number): number {
	const index = vectorXToCol(pixel);
	let centerPixel: number;

	if (count % 2 === 1) {
		// 홀수: 그리드 중심에 스냅
		centerPixel = colToVectorX(index);
	} else {
		// 짝수: 가장 가까운 그리드 경계에 스냅
		const leftBoundary = index * CELL_SIZE;
		const rightBoundary = (index + 1) * CELL_SIZE;
		centerPixel = pixel - leftBoundary < rightBoundary - pixel ? leftBoundary : rightBoundary;
	}

	return colToVectorX(centerPixel) - Math.floor(count / 2);
}

/**
 * 마우스 위치로부터 좌상단 그리드 인덱스 계산 (x, y 동시 처리)
 */
export function vectorToTopLeftVector(vector: Vector, cols: number, rows: number): Vector {
	return {
		x: pixelToTopLeft(vector.x, cols),
		y: pixelToTopLeft(vector.y, rows),
	};
}

/**
 * 좌상단 인덱스로 차지하는 벡터들 생성
 * @param x 좌상단 X 인덱스
 * @param y 좌상단 Y 인덱스
 * @param cols 가로 크기
 * @param rows 세로 크기
 */
export function createVectors(x: number, y: number, cols: number, rows: number): Vector[] {
	const vectors: Vector[] = [];

	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			vectors.push({ x: x + col, y: y + row });
		}
	}

	return vectors;
}

/**
 * 두 벡터 배열의 겹치는 벡터들 반환
 */
export function getOverlappingVectors(vectorsA: Vector[], vectorsB: Vector[]): Vector[] {
	const setB = new Set(vectorsB.map((v) => `${v.x},${v.y}`));
	return vectorsA.filter((v) => setB.has(`${v.x},${v.y}`));
}

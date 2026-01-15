import { CELL_SIZE, TILE_SIZE } from '$lib/constants';
import type {
	Vector,
	Cell,
	TileCell,
	VectorKey,
	CellKey,
	TileCellKey,
	ScreenVector,
	ScreenVectorKey,
} from '$lib/types';

/**
 * Vector 브랜드 타입 생성
 */
function createVector(x: number, y: number): Vector {
	return { x, y } as Vector;
}

/**
 * VectorKey 브랜드 타입 생성
 */
function createVectorKey(x: number, y: number): VectorKey {
	return `${x},${y}` as VectorKey;
}

/**
 * Vector 브랜드 타입 생성
 */
function createScreenVector(x: number, y: number): ScreenVector {
	return { x, y } as ScreenVector;
}

/**
 * VectorKey 브랜드 타입 생성
 */
function createScreenVectorKey(x: number, y: number): ScreenVectorKey {
	return `${x},${y}` as ScreenVectorKey;
}

/**
 * Cell 브랜드 타입 생성
 */
function createCell(col: number, row: number): Cell {
	return { col, row } as Cell;
}

/**
 * CellKey 브랜드 타입 생성
 */
function createCellKey(col: number, row: number): CellKey {
	return `${col},${row}` as CellKey;
}

/**
 * Tile 브랜드 타입 생성
 */
function createTileCell(col: number, row: number): TileCell {
	return { col, row } as TileCell;
}

/**
 * TileKey 브랜드 타입 생성
 */
function createTileCellKey(col: number, row: number): TileCellKey {
	return `${col},${row}` as TileCellKey;
}

/**
 * 픽셀 좌표를 셀 인덱스로 변환
 */
function pixelToCellIndex(pixel: number): number {
	return Math.floor(pixel / CELL_SIZE);
}

/**
 * 셀 인덱스를 월드 픽셀 좌표(셀 중심)로 변환
 */
function cellIndexToPixel(index: number): number {
	return index * CELL_SIZE + CELL_SIZE / 2;
}

/**
 * 픽셀 좌표를 타일 인덱스로 변환
 */
function pixelToTileIndex(pixel: number): number {
	return Math.floor(pixel / TILE_SIZE);
}

/**
 * 타일 인덱스를 월드 픽셀 좌표(타일 중심)로 변환
 */
function tileIndexToPixel(index: number): number {
	return index * TILE_SIZE + TILE_SIZE / 2;
}

/**
 * 커서 픽셀 위치를 엔티티 크기(셀 개수)에 맞게 그리드에 스냅
 *
 * @param pixel - 커서의 월드 픽셀 좌표
 * @param size - 엔티티가 차지하는 셀 개수 (1, 2, 3칸 등)
 * @returns 그리드에 정렬된 기준 픽셀 좌표
 *
 * 동작 방식:
 * - count가 홀수 (1, 3, 5칸): 커서가 있는 셀의 **중앙 픽셀** 반환
 *   → 엔티티가 커서를 중심으로 배치되는 느낌
 *   예) pixel=42 (셀5), count=3 → 44 반환 (셀4의 중앙)
 *
 * - count가 짝수 (2, 4, 6칸): 커서와 **가까운 셀 경계 픽셀** 반환
 *   → 엔티티가 그리드 경계에 딱 맞게 배치되는 느낌
 *   예) pixel=42 (셀5 왼쪽), count=2 → 32 반환 (셀4 시작점)
 *   예) pixel=45 (셀5 오른쪽), count=2 → 40 반환 (셀5 시작점)
 */
function snapPixelByCell(pixel: number, size: number): number {
	const index = pixelToCellIndex(pixel);
	let snapTarget: number;

	if (size % 2 === 1) {
		// 홀수: 커서가 있는 셀의 중앙
		snapTarget = cellIndexToPixel(index);
	} else {
		// 짝수: 커서와 가까운 셀 경계
		const leftBoundary = index * CELL_SIZE;
		const rightBoundary = (index + 1) * CELL_SIZE;
		snapTarget = pixel - leftBoundary < rightBoundary - pixel ? leftBoundary : rightBoundary;
	}

	return snapTarget - Math.floor(size / 2) * CELL_SIZE;
}

/**
 * 커서 벡터를 엔티티 크기에 맞게 그리드에 스냅 (x, y 동시 처리)
 *
 * @param vector - 커서의 월드 픽셀 좌표
 * @param colSize - 엔티티가 차지하는 가로 셀 개수
 * @param rowSize - 엔티티가 차지하는 세로 셀 개수
 * @returns 그리드에 정렬된 기준 벡터
 */
function snapVectorByCell(vector: Vector, colSize: number, rowSize: number): Vector {
	return createVector(snapPixelByCell(vector.x, colSize), snapPixelByCell(vector.y, rowSize));
}

/**
 * 좌상단 인덱스로 차지하는 셀들 생성
 * @param col 좌상단 col 인덱스
 * @param row 좌상단 row 인덱스
 * @param cols 가로 크기
 * @param rows 세로 크기
 */
function createCells(col: number, row: number, cols: number, rows: number): Cell[] {
	const cells: Cell[] = [];

	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			cells.push(createCell(col + c, row + r));
		}
	}

	return cells;
}

/**
 * 두 셀 배열의 겹치는 셀들 반환
 */
function getOverlappingCells(cellsA: Cell[], cellsB: Cell[]): Cell[] {
	const setB = new Set(cellsB.map((c) => `${c.col},${c.row}`));
	return cellsA.filter((c) => setB.has(`${c.col},${c.row}`));
}

/**
 * 픽셀 좌표를 셀로 변환
 */
function vectorToCell(vector: Vector): Cell {
	return createCell(pixelToCellIndex(vector.x), pixelToCellIndex(vector.y));
}

/**
 * 셀을 픽셀 좌표(셀 중심)로 변환
 */
function cellToVector(cell: Cell): Vector {
	return createVector(cellIndexToPixel(cell.col), cellIndexToPixel(cell.row));
}

/**
 * 픽셀 좌표를 타일 셀로 변환
 */
function vectorToTileCell(vector: Vector): TileCell {
	return createTileCell(pixelToTileIndex(vector.x), pixelToTileIndex(vector.y));
}

/**
 * 타일 셀을 픽셀 좌표(타일 중심)로 변환
 */
function tileCellToVector(tile: TileCell): Vector {
	return createVector(tileIndexToPixel(tile.col), tileIndexToPixel(tile.row));
}

export const vectorUtils = {
	// 브랜드 타입 생성
	createVector,
	createVectorKey,
	createScreenVector,
	createScreenVectorKey,
	createCell,
	createCellKey,
	createTileCell,
	createTileCellKey,
	// 저수준 좌표 변환
	pixelToCellIndex,
	cellIndexToPixel,
	pixelToTileIndex,
	tileIndexToPixel,
	snapPixelByCell,
	snapVectorByCell,
	// 고수준 좌표 변환
	vectorToCell,
	cellToVector,
	vectorToTileCell,
	tileCellToVector,
	// 셀 배열 생성
	createCells,
	getOverlappingCells,
};

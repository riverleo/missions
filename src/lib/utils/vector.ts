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
 * 마우스 위치로부터 좌상단 그리드의 픽셀 좌표 계산
 * - 홀수 count: 그리드 중심에 스냅
 * - 짝수 count: 그리드 경계에 스냅
 */
function pixelToTopLeft(pixel: number, count: number): number {
	const index = pixelToCellIndex(pixel);
	let centerPixel: number;

	if (count % 2 === 1) {
		// 홀수: 그리드 중심에 스냅
		centerPixel = cellIndexToPixel(index);
	} else {
		// 짝수: 가장 가까운 그리드 경계에 스냅
		const leftBoundary = index * CELL_SIZE;
		const rightBoundary = (index + 1) * CELL_SIZE;
		centerPixel = pixel - leftBoundary < rightBoundary - pixel ? leftBoundary : rightBoundary;
	}

	return centerPixel - Math.floor(count / 2) * CELL_SIZE;
}

/**
 * 마우스 위치로부터 좌상단 그리드 인덱스 계산 (x, y 동시 처리)
 */
function vectorToTopLeftVector(vector: Vector, cols: number, rows: number): Vector {
	return createVector(pixelToTopLeft(vector.x, cols), pixelToTopLeft(vector.y, rows));
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
	pixelToTopLeft,
	vectorToTopLeftVector,
	// 고수준 좌표 변환
	vectorToCell,
	cellToVector,
	vectorToTileCell,
	tileCellToVector,
	// 셀 배열 생성
	createCells,
	getOverlappingCells,
};

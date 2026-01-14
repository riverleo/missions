import { CELL_SIZE } from '$lib/constants';
import PF from 'pathfinding';
import type { Vector } from '$lib/utils/vector';
import type { WorldContext } from '../context';
import { initializeWalkable, setWalkable, setTileToUnwalkable } from './walkable';
import type { Matrix, MatrixKey, PathfinderCell } from '$lib/types';

export class Pathfinder {
	readonly grid: PF.Grid;
	readonly finder: PF.AStarFinder;
	readonly worldContext: WorldContext;
	declare cells: Record<MatrixKey, PathfinderCell>;

	readonly cols: number;
	readonly rows: number;
	readonly size: number;

	constructor(worldContext: WorldContext, width: number, height: number, size: number = CELL_SIZE) {
		this.worldContext = worldContext;
		this.size = size;
		this.cols = Math.ceil(width / size);
		this.rows = Math.ceil(height / size);
		this.grid = new PF.Grid(this.cols, this.rows);
		this.finder = new PF.AStarFinder();
		this.cells = $state<Record<MatrixKey, PathfinderCell>>({});
	}

	/**
	 * 단일 축 월드 픽셀 좌표를 그리드 열 인덱스로 변환
	 */
	worldXToCol(worldX: number) {
		return Math.floor(worldX / this.size);
	}

	/**
	 * 단일 축 월드 픽셀 좌표를 그리드 행 인덱스로 변환
	 */
	worldYToRow(worldY: number) {
		return Math.floor(worldY / this.size);
	}

	/**
	 * 월드 픽셀 좌표를 그리드 좌표(행렬)로 변환
	 */
	worldToMatrix(worldPos: Vector): Matrix {
		return { col: this.worldXToCol(worldPos.x), row: this.worldYToRow(worldPos.y) };
	}

	/**
	 * 그리드 열 인덱스를 월드 픽셀 좌표(타일 중심)로 변환
	 */
	colToWorldX(col: number) {
		return col * this.size + this.size / 2;
	}

	/**
	 * 그리드 행 인덱스를 월드 픽셀 좌표(타일 중심)로 변환
	 */
	rowToWorldY(row: number) {
		return row * this.size + this.size / 2;
	}

	/**
	 * 그리드 좌표(행렬)를 월드 픽셀 좌표(타일 중심)로 변환
	 */
	matrixToWorld(matrix: Matrix): Vector {
		return { x: this.colToWorldX(matrix.col), y: this.rowToWorldY(matrix.row) };
	}

	/**
	 * 그리드 좌표로 셀 정보 가져오기
	 */
	getCell(matrix: Matrix): PathfinderCell | undefined {
		return this.cells[`${matrix.col},${matrix.row}`];
	}

	/**
	 * 월드 픽셀 좌표로 셀 정보 가져오기
	 */
	getCellFromWorld(worldPos: Vector): PathfinderCell | undefined {
		const matrix = this.worldToMatrix(worldPos);
		return this.getCell(matrix);
	}

	/**
	 * cells Record 업데이트
	 */
	private updateCells() {
		const newCells: Record<MatrixKey, PathfinderCell> = {};

		for (let row = 0; row < this.rows; row++) {
			for (let col = 0; col < this.cols; col++) {
				const isWalkable = this.grid.isWalkableAt(col, row);
				const matrixKey = `${col},${row}` as MatrixKey;

				newCells[matrixKey] = {
					col,
					row,
					walkable: isWalkable,
					jumpable: !isWalkable, // All non-walkable cells are potentially jumpable
				};
			}
		}

		this.cells = newCells;
	}

	/**
	 * 월드 픽셀 좌표로 경로 탐색 (결과도 월드 픽셀 좌표)
	 */
	findPath(from: Vector, to: Vector): Vector[] {
		const startMatrix = this.worldToMatrix(from);
		const endMatrix = this.worldToMatrix(to);

		const path = this.finder.findPath(
			startMatrix.col,
			startMatrix.row,
			endMatrix.col,
			endMatrix.row,
			this.grid.clone()
		);

		// 그리드 좌표를 월드 픽셀 좌표(타일 중심)로 변환
		return path.map((point) => ({
			x: this.colToWorldX(point[0] as number),
			y: this.rowToWorldY(point[1] as number),
		}));
	}

	/**
	 * worldContext의 타일들을 기반으로 전체 walkable 영역 업데이트
	 */
	update() {
		initializeWalkable(this);
		setWalkable(this);
		setTileToUnwalkable(this);
		this.updateCells();
	}
}

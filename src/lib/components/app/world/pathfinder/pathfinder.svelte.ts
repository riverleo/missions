import { CELL_SIZE } from '$lib/constants';
import PF from 'pathfinding';
import type { Vector, Cell, CellKey, PathfinderCell } from '$lib/types';
import type { WorldContext } from '../context';
import { initializeWalkable, setWalkable, setTileToUnwalkable } from './walkable';

export class Pathfinder {
	readonly grid: PF.Grid;
	readonly finder: PF.AStarFinder;
	readonly worldContext: WorldContext;
	declare cells: Record<CellKey, PathfinderCell>;

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
		this.cells = $state<Record<CellKey, PathfinderCell>>({});

		// cells 초기화
		this.initializeCells();
	}

	/**
	 * cells를 grid 기반으로 초기화 (한 번만 실행)
	 */
	private initializeCells() {
		for (let row = 0; row < this.rows; row++) {
			for (let col = 0; col < this.cols; col++) {
				const cellKey = `${col},${row}` as CellKey;
				this.cells[cellKey] = {
					col,
					row,
					walkable: false,
					jumpable: false,
				};
			}
		}
	}

	/**
	 * 단일 축 월드 픽셀 좌표를 그리드 열 인덱스로 변환
	 */
	vectorXToCol(vectorX: number) {
		return Math.floor(vectorX / this.size);
	}

	/**
	 * 단일 축 월드 픽셀 좌표를 그리드 행 인덱스로 변환
	 */
	vectorYToRow(vectorY: number) {
		return Math.floor(vectorY / this.size);
	}

	/**
	 * 월드 픽셀 좌표를 그리드 좌표(행렬)로 변환
	 */
	vectorToCell(vector: Vector): Cell {
		return { col: this.vectorXToCol(vector.x), row: this.vectorYToRow(vector.y) };
	}

	/**
	 * 그리드 열 인덱스를 월드 픽셀 좌표(타일 중심)로 변환
	 */
	colToVectorX(col: number) {
		return col * this.size + this.size / 2;
	}

	/**
	 * 그리드 행 인덱스를 월드 픽셀 좌표(타일 중심)로 변환
	 */
	rowToVectorY(row: number) {
		return row * this.size + this.size / 2;
	}

	/**
	 * 그리드 좌표(행렬)를 월드 픽셀 좌표(타일 중심)로 변환
	 */
	cellToVector(cell: Cell): Vector {
		return { x: this.colToVectorX(cell.col), y: this.rowToVectorY(cell.row) };
	}

	/**
	 * 그리드 좌표로 셀 정보 가져오기
	 */
	getCell(cell: Cell): PathfinderCell | undefined {
		return this.cells[`${cell.col},${cell.row}` as CellKey];
	}

	/**
	 * 월드 픽셀 좌표로 셀 정보 가져오기
	 */
	getCellFromVector(vector: Vector): PathfinderCell | undefined {
		const cell = this.vectorToCell(vector);
		return this.getCell(cell);
	}

	/**
	 * 월드 픽셀 좌표로 경로 탐색 (결과도 월드 픽셀 좌표)
	 */
	findPath(from: Vector, to: Vector): Vector[] {
		const startCell = this.vectorToCell(from);
		const endCell = this.vectorToCell(to);

		const path = this.finder.findPath(
			startCell.col,
			startCell.row,
			endCell.col,
			endCell.row,
			this.grid.clone()
		);

		// 그리드 좌표를 월드 픽셀 좌표(타일 중심)로 변환
		return path.map((point) => ({
			x: this.colToVectorX(point[0] as number),
			y: this.rowToVectorY(point[1] as number),
		}));
	}

	/**
	 * worldContext의 타일들을 기반으로 전체 walkable 영역 업데이트
	 */
	update() {
		initializeWalkable(this);
		setTileToUnwalkable(this);
	}
}

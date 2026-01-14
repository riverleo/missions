import { CELL_SIZE } from '$lib/constants';
import PF from 'pathfinding';
import type { Vector, Cell, CellKey, PathfinderCell } from '$lib/types';
import type { WorldContext } from '../context';
import { vectorXToCol, vectorYToRow, colToVectorX, rowToVectorY } from '$lib/utils/vector';
import { initializeWalkable, setWalkable, setTileToUnwalkable } from './walkable';

export class Pathfinder {
	readonly grid: PF.Grid;
	readonly finder: PF.AStarFinder;
	readonly worldContext: WorldContext;
	declare cells: Record<CellKey, PathfinderCell>;

	readonly cols: number;
	readonly rows: number;

	constructor(worldContext: WorldContext, width: number, height: number) {
		this.worldContext = worldContext;
		this.cols = Math.ceil(width / CELL_SIZE);
		this.rows = Math.ceil(height / CELL_SIZE);
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
	 * 그리드 좌표로 셀 정보 가져오기
	 */
	getCell(cell: Cell): PathfinderCell | undefined {
		return this.cells[`${cell.col},${cell.row}` as CellKey];
	}

	/**
	 * 월드 픽셀 좌표로 경로 탐색 (결과도 월드 픽셀 좌표)
	 */
	findPath(from: Vector, to: Vector): Vector[] {
		const startCol = vectorXToCol(from.x);
		const startRow = vectorYToRow(from.y);
		const endCol = vectorXToCol(to.x);
		const endRow = vectorYToRow(to.y);

		const path = this.finder.findPath(startCol, startRow, endCol, endRow, this.grid.clone());

		// 그리드 좌표를 월드 픽셀 좌표(타일 중심)로 변환
		return path.map((point) => ({
			x: colToVectorX(point[0] as number),
			y: rowToVectorY(point[1] as number),
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

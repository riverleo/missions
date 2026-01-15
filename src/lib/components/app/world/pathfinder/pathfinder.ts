import { CELL_SIZE } from '$lib/constants';
import PF from 'pathfinding';
import type { Vector, CellKey } from '$lib/types';
import type { WorldContext } from '../context';
import { vectorUtils } from '$lib/utils/vector';
import { initializeWalkable, setWalkable, setTileToUnwalkable, setJumpable } from './walkable';

export class Pathfinder {
	readonly grid: PF.Grid;
	readonly finder: PF.AStarFinder;
	readonly worldContext: WorldContext;
	jumpableCells: Set<CellKey>;

	readonly cols: number;
	readonly rows: number;

	constructor(worldContext: WorldContext, width: number, height: number) {
		this.worldContext = worldContext;
		this.cols = Math.ceil(width / CELL_SIZE);
		this.rows = Math.ceil(height / CELL_SIZE);
		this.grid = new PF.Grid(this.cols, this.rows);
		this.finder = new PF.AStarFinder();
		this.jumpableCells = new Set();
	}

	/**
	 * 셀이 jumpable인지 확인
	 */
	isJumpable(cellKey: CellKey): boolean {
		return this.jumpableCells.has(cellKey);
	}

	/**
	 * 월드 픽셀 좌표로 경로 탐색 (결과도 월드 픽셀 좌표)
	 */
	findPath(from: Vector, to: Vector): Vector[] {
		const startCol = vectorUtils.pixelToCellIndex(from.x);
		const startRow = vectorUtils.pixelToCellIndex(from.y);
		const endCol = vectorUtils.pixelToCellIndex(to.x);
		const endRow = vectorUtils.pixelToCellIndex(to.y);

		const path = this.finder.findPath(startCol, startRow, endCol, endRow, this.grid.clone());

		// 그리드 좌표를 월드 픽셀 좌표(타일 중심)로 변환
		return path.map((point) =>
			vectorUtils.createVector(
				vectorUtils.cellIndexToPixel(point[0] as number),
				vectorUtils.cellIndexToPixel(point[1] as number)
			)
		);
	}

	/**
	 * worldContext의 타일들을 기반으로 전체 walkable 영역 업데이트
	 */
	update() {
		// 1. grid 기반 walkable 설정
		initializeWalkable(this);
		setWalkable(this);
		setTileToUnwalkable(this);

		// 2. jumpable 영역 설정
		this.jumpableCells.clear();
		setJumpable(this);
	}
}

import { CELL_SIZE } from '$lib/constants';
import PF from 'pathfinding';
import type { Vector, CellKey } from '$lib/types';
import type { WorldContext } from '../context';
import { vectorUtils } from '$lib/utils/vector';
import { cell } from './cell';

export class Pathfinder {
	readonly grid: PF.Grid;
	readonly finder: PF.AStarFinder;
	readonly worldContext: WorldContext;
	readonly walkables: Set<CellKey>;

	readonly cols: number;
	readonly rows: number;

	constructor(worldContext: WorldContext, width: number, height: number) {
		this.worldContext = worldContext;
		this.cols = Math.ceil(width / CELL_SIZE);
		this.rows = Math.ceil(height / CELL_SIZE);
		this.grid = new PF.Grid(this.cols, this.rows);
		this.finder = new PF.AStarFinder();
		this.walkables = new Set();
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
	 * 가장 가까운 walkable 셀 찾기 (BFS)
	 * 월드 픽셀 좌표를 받아서 월드 픽셀 좌표 반환
	 */
	findNearestWalkableCell(position: Vector): Vector | undefined {
		const startCol = vectorUtils.pixelToCellIndex(position.x);
		const startRow = vectorUtils.pixelToCellIndex(position.y);

		// 시작 셀이 이미 walkable이면 그대로 반환
		if (this.grid.isWalkableAt(startCol, startRow)) {
			return vectorUtils.createVector(
				vectorUtils.cellIndexToPixel(startCol),
				vectorUtils.cellIndexToPixel(startRow)
			);
		}

		// BFS로 가장 가까운 walkable 셀 찾기
		const visited = new Set<string>();
		const queue: Array<{ col: number; row: number; distance: number }> = [];
		queue.push({ col: startCol, row: startRow, distance: 0 });
		visited.add(`${startCol},${startRow}`);

		const directions: Array<[number, number]> = [
			[0, -1],
			[1, 0],
			[0, 1],
			[-1, 0],
		]; // 상우하좌

		while (queue.length > 0) {
			const current = queue.shift()!;

			for (const [dx, dy] of directions) {
				const nextCol = current.col + dx;
				const nextRow = current.row + dy;
				const key = `${nextCol},${nextRow}`;

				// 범위 체크
				if (nextCol < 0 || nextCol >= this.cols || nextRow < 0 || nextRow >= this.rows) {
					continue;
				}

				// 이미 방문했으면 스킵
				if (visited.has(key)) {
					continue;
				}

				visited.add(key);

				// walkable이면 반환
				if (this.grid.isWalkableAt(nextCol, nextRow)) {
					return vectorUtils.createVector(
						vectorUtils.cellIndexToPixel(nextCol),
						vectorUtils.cellIndexToPixel(nextRow)
					);
				}

				// walkable이 아니면 큐에 추가
				queue.push({ col: nextCol, row: nextRow, distance: current.distance + 1 });
			}
		}

		// 찾지 못함
		return undefined;
	}

	/**
	 * worldContext의 타일들을 기반으로 전체 walkable 영역 업데이트
	 */
	update() {
		cell.reset(this);
		cell.update(this);
	}
}

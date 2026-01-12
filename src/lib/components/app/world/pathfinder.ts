import { CELL_SIZE } from '$lib/constants';
import PF from 'pathfinding';
import Matter from 'matter-js';
import type { Vector } from '$lib/utils/vector';

const { Query, Composite } = Matter;

export class Pathfinder {
	private grid: PF.Grid;
	private finder: PF.AStarFinder;
	private engine: Matter.Engine | undefined;

	readonly cols: number;
	readonly rows: number;
	readonly size: number;

	constructor(width: number, height: number, size: number = CELL_SIZE) {
		this.size = size;
		this.cols = Math.ceil(width / size);
		this.rows = Math.ceil(height / size);
		this.grid = new PF.Grid(this.cols, this.rows);
		this.finder = new PF.AStarFinder({
			allowDiagonal: true,
		});

		this.reset();
	}

	/**
	 * Matter.js engine 설정 (walkable 계산용)
	 */
	setEngine(engine: Matter.Engine) {
		this.engine = engine;
	}

	/**
	 * 단일 축 픽셀 좌표를 타일 인덱스로 변환
	 *
	 * 예시 (tileSize = 4):
	 * - pixel 0~3 → tile index 0
	 * - pixel 4~7 → tile index 1
	 * - pixel 8~11 → tile index 2
	 *
	 * x축과 y축 변환 공식이 동일하므로 1차원 헬퍼로 분리.
	 * 2D 좌표가 필요하면 x, y 각각에 대해 호출하면 됨.
	 */
	pixelToCellIndex(pixel: number) {
		return Math.floor(pixel / this.size);
	}

	/**
	 * 단일 축 타일 인덱스를 해당 타일의 중심 픽셀 좌표로 변환
	 *
	 * 예시 (tileSize = 4):
	 * - tile index 0 → pixel 2 (타일 중심)
	 * - tile index 1 → pixel 6 (타일 중심)
	 * - tile index 2 → pixel 10 (타일 중심)
	 *
	 * x축과 y축 변환 공식이 동일하므로 1차원 헬퍼로 분리.
	 * 2D 좌표가 필요하면 tileToPixel(tileX, tileY) 사용.
	 */
	cellIndexToPixel(cell: number) {
		return cell * this.size + this.size / 2;
	}

	/**
	 * 특정 타일을 걸을 수 있는지 여부 설정
	 */
	setWalkable(tileX: number, tileY: number, walkable: boolean) {
		if (tileX >= 0 && tileX < this.cols && tileY >= 0 && tileY < this.rows) {
			this.grid.setWalkableAt(tileX, tileY, walkable);
		}
	}

	/**
	 * 특정 타일이 걸을 수 있는지 확인
	 */
	isWalkable(cellX: number, cellY: number) {
		if (cellX >= 0 && cellX < this.cols && cellY >= 0 && cellY < this.rows) {
			return this.grid.isWalkableAt(cellX, cellY);
		}
		return false;
	}

	/**
	 * 픽셀 좌표로 경로 탐색 (결과도 픽셀 좌표)
	 */
	findPath(fromX: number, fromY: number, toX: number, toY: number): Vector[] {
		const startTileX = this.pixelToCellIndex(fromX);
		const startTileY = this.pixelToCellIndex(fromY);
		const endTileX = this.pixelToCellIndex(toX);
		const endTileY = this.pixelToCellIndex(toY);

		// 그리드 복사본 사용 (finder가 그리드를 수정하기 때문)
		const gridClone = this.grid.clone();
		const path = this.finder.findPath(startTileX, startTileY, endTileX, endTileY, gridClone);

		// 타일 좌표를 픽셀 좌표(타일 중심)로 변환
		return path.map((point) => ({
			x: this.cellIndexToPixel(point[0] as number),
			y: this.cellIndexToPixel(point[1] as number),
		}));
	}

	/**
	 * 경로 스무딩 (불필요한 중간점 제거)
	 */
	smoothPath(path: Vector[]): Vector[] {
		if (path.length <= 2) return path;

		const first = path[0];
		const last = path[path.length - 1];
		if (!first || !last) return path;

		const smoothed: Vector[] = [first];

		for (let i = 1; i < path.length - 1; i++) {
			const prev = smoothed[smoothed.length - 1];
			const curr = path[i];
			const next = path[i + 1];
			if (!prev || !curr || !next) continue;

			// 방향이 변경되는 점만 유지
			const dx1 = curr.x - prev.x;
			const dy1 = curr.y - prev.y;
			const dx2 = next.x - curr.x;
			const dy2 = next.y - curr.y;

			if (dx1 !== dx2 || dy1 !== dy2) {
				smoothed.push(curr);
			}
		}

		smoothed.push(last);
		return smoothed;
	}

	/**
	 * 전체 그리드를 walkable로 초기화
	 */
	reset() {
		for (let y = 0; y < this.rows; y++) {
			for (let x = 0; x < this.cols; x++) {
				this.grid.setWalkableAt(x, y, true);
			}
		}
	}
}

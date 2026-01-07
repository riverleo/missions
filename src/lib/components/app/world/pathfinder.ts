import PF from 'pathfinding';
import { PATHFINDING_TILE_SIZE } from './constants';

export interface PathPoint {
	x: number;
	y: number;
}

export class Pathfinder {
	private grid: PF.Grid;
	private finder: PF.AStarFinder;

	readonly cols: number;
	readonly rows: number;
	readonly tileSize: number;

	constructor(width: number, height: number, tileSize: number = PATHFINDING_TILE_SIZE) {
		this.tileSize = tileSize;
		this.cols = Math.ceil(width / tileSize);
		this.rows = Math.ceil(height / tileSize);
		this.grid = new PF.Grid(this.cols, this.rows);
		this.finder = new PF.AStarFinder({
			allowDiagonal: true,
		});

		this.reset();
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
	pixelToTileIndex(pixel: number) {
		return Math.floor(pixel / this.tileSize);
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
	 * 2D 좌표가 필요하면 tileToCenterPixel(tileX, tileY) 사용.
	 */
	tileIndexToPixel(tile: number) {
		return tile * this.tileSize + this.tileSize / 2;
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
	isWalkable(tileX: number, tileY: number) {
		if (tileX >= 0 && tileX < this.cols && tileY >= 0 && tileY < this.rows) {
			return this.grid.isWalkableAt(tileX, tileY);
		}
		return false;
	}

	/**
	 * 픽셀 좌표로 경로 탐색 (결과도 픽셀 좌표)
	 */
	findPath(fromX: number, fromY: number, toX: number, toY: number): PathPoint[] {
		const startTileX = this.pixelToTileIndex(fromX);
		const startTileY = this.pixelToTileIndex(fromY);
		const endTileX = this.pixelToTileIndex(toX);
		const endTileY = this.pixelToTileIndex(toY);

		// 그리드 복사본 사용 (finder가 그리드를 수정하기 때문)
		const gridClone = this.grid.clone();
		const path = this.finder.findPath(startTileX, startTileY, endTileX, endTileY, gridClone);

		// 타일 좌표를 픽셀 좌표(타일 중심)로 변환
		return path.map((point) => ({
			x: this.tileIndexToPixel(point[0] as number),
			y: this.tileIndexToPixel(point[1] as number),
		}));
	}

	/**
	 * 경로 스무딩 (불필요한 중간점 제거)
	 */
	smoothPath(path: PathPoint[]): PathPoint[] {
		if (path.length <= 2) return path;

		const first = path[0];
		const last = path[path.length - 1];
		if (!first || !last) return path;

		const smoothed: PathPoint[] = [first];

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

	/**
	 * 사각형 영역을 non-walkable로 설정 (건물 등)
	 */
	blockRect(tileX: number, tileY: number, tileCols: number, tileRows: number) {
		for (let dy = 0; dy < tileRows; dy++) {
			for (let dx = 0; dx < tileCols; dx++) {
				this.setWalkable(tileX + dx, tileY + dy, false);
			}
		}
	}

	/**
	 * Matter.js 바디를 기반으로 unwalkable 영역 설정
	 */
	blockBody(body: Matter.Body) {
		const minX = this.pixelToTileIndex(body.bounds.min.x);
		const minY = this.pixelToTileIndex(body.bounds.min.y);
		const maxX = this.pixelToTileIndex(body.bounds.max.x);
		const maxY = this.pixelToTileIndex(body.bounds.max.y);

		for (let y = minY; y <= maxY; y++) {
			for (let x = minX; x <= maxX; x++) {
				this.setWalkable(x, y, false);
			}
		}
	}

	/**
	 * 디버그용: 그리드 상태 출력
	 */
	debugPrint() {
		let output = '';
		for (let y = 0; y < this.rows; y++) {
			for (let x = 0; x < this.cols; x++) {
				output += this.grid.isWalkableAt(x, y) ? '.' : '#';
			}
			output += '\n';
		}
	}
}

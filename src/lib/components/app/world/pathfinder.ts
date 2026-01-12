import { CELL_SIZE, TILE_SIZE, TILE_CELL_RATIO } from '$lib/constants';
import PF from 'pathfinding';
import type { Vector } from '$lib/utils/vector';
import type { WorldContext } from './context';
import type { WorldTileEntity } from './entities/world-tile-entity';

export class Pathfinder {
	private grid: PF.Grid;
	private finder: PF.AStarFinder;
	private worldContext: WorldContext;

	readonly cols: number;
	readonly rows: number;
	readonly size: number;

	constructor(worldContext: WorldContext, width: number, height: number, size: number = CELL_SIZE) {
		this.worldContext = worldContext;
		this.size = size;
		this.cols = Math.ceil(width / size);
		this.rows = Math.ceil(height / size);
		this.grid = new PF.Grid(this.cols, this.rows);
		this.finder = new PF.AStarFinder({
			allowDiagonal: false,
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
	 * 전체 그리드를 초기화: 바닥에서 3칸 위 1칸만 walkable로 설정
	 */
	reset() {
		// 모든 셀을 unwalkable로 초기화
		for (let y = 0; y < this.rows; y++) {
			for (let x = 0; x < this.cols; x++) {
				this.grid.setWalkableAt(x, y, false);
			}
		}

		// 바닥에서 3칸 위 1칸만 walkable로 설정
		const walkableY = this.rows - 1 - 2; // 3번째 칸 (0-indexed로 -2)
		if (walkableY >= 0) {
			for (let x = 0; x < this.cols; x++) {
				this.grid.setWalkableAt(x, walkableY, true);
			}
		}
	}

	/**
	 * worldContext의 타일들을 기반으로 전체 walkable 영역 재계산
	 */
	update() {
		// 전체 초기화 (바닥에서 3칸 위 1칸 walkable)
		this.reset();

		// 월드의 모든 타일 엔티티 수집
		const tileEntities = Object.values(this.worldContext.entities).filter(
			(entity): entity is WorldTileEntity => entity.type === 'tile'
		);

		const walkableSize = 3;

		// 타일 외곽 walkable 설정 (가장 바깥쪽 1칸만)
		for (const tile of tileEntities) {
			const cellX = tile.tileX * TILE_CELL_RATIO;
			const cellY = tile.tileY * TILE_CELL_RATIO;

			// 타일 위쪽 가장 바깥 1칸 (좌우로 3칸씩 확장)
			const topY = cellY - walkableSize;
			for (let dx = -walkableSize; dx < TILE_CELL_RATIO + walkableSize; dx++) {
				this.setWalkable(cellX + dx, topY, true);
			}

			// 타일 왼쪽 세로 1줄 (타일 최상단부터 상단 walkable까지 연결)
			for (let y = cellY; y >= topY; y--) {
				this.setWalkable(cellX - walkableSize, y, true);
			}

			// 타일 오른쪽 세로 1줄 (타일 최상단부터 상단 walkable까지 연결)
			for (let y = cellY; y >= topY; y--) {
				this.setWalkable(cellX + TILE_CELL_RATIO + walkableSize - 1, y, true);
			}
		}

		// 마지막에 모든 타일이 차지하는 영역을 unwalkable로 일괄 설정
		for (const tile of tileEntities) {
			const cellX = tile.tileX * TILE_CELL_RATIO;
			const cellY = tile.tileY * TILE_CELL_RATIO;

			for (let dy = 0; dy < TILE_CELL_RATIO; dy++) {
				for (let dx = 0; dx < TILE_CELL_RATIO; dx++) {
					this.setWalkable(cellX + dx, cellY + dy, false);
				}
			}
		}
	}
}

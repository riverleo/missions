import { CELL_SIZE, TILE_CELL_RATIO, BOUNDARY_THICKNESS } from '$lib/constants';
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

		const path = this.finder.findPath(
			startTileX,
			startTileY,
			endTileX,
			endTileY,
			this.grid.clone()
		);

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
	 * 전체 그리드를 초기화
	 */
	reset() {
		// 모든 셀을 unwalkable로 초기화
		for (let y = 0; y < this.rows; y++) {
			for (let x = 0; x < this.cols; x++) {
				this.grid.setWalkableAt(x, y, false);
			}
		}
	}

	/**
	 * worldContext의 타일들을 기반으로 전체 walkable 영역 그리기
	 */
	draw() {
		this.reset();

		// 1. 바닥(boundary bottom) 위로 2번째 노드를 walkable로 설정
		if (this.worldContext.boundaries) {
			// 바닥의 상단 y 좌표 (중심 - 높이의 절반)
			const bottomTopY = this.worldContext.boundaries.bottom.position.y - BOUNDARY_THICKNESS / 2;
			const bottomTopCellY = this.pixelToCellIndex(bottomTopY);

			// 바닥 위로 2번째 셀
			for (let x = 0; x < this.cols; x++) {
				this.setWalkable(x, bottomTopCellY - 2, true);
			}
		}

		// 2. 모든 타일 위/아래로 walkable 설정
		const tileEntities = Object.values(this.worldContext.entities).filter(
			(entity): entity is WorldTileEntity => entity.type === 'tile'
		);

		// 타일 위치 맵 생성 (빠른 조회용)
		const tilePositions = new Set(tileEntities.map((tile) => `${tile.tileX},${tile.tileY}`));

		for (const tile of tileEntities) {
			const cellX = tile.tileX * TILE_CELL_RATIO;
			const cellY = tile.tileY * TILE_CELL_RATIO;

			// 좌측/우측 인접 타일 확인
			const hasLeftTile = tilePositions.has(`${tile.tileX - 1},${tile.tileY}`);
			const hasRightTile = tilePositions.has(`${tile.tileX + 1},${tile.tileY}`);

			// 타일 너비만큼 walkable 설정
			for (let dx = 0; dx < TILE_CELL_RATIO; dx++) {
				this.setWalkable(cellX + dx, cellY - 2, true);

				// 좌측 끝 또는 우측 끝에만 아래 walkable 설정
				const isLeftEdge = !hasLeftTile && dx === 0;
				const isRightEdge = !hasRightTile && dx === TILE_CELL_RATIO - 1;

				if (isLeftEdge || isRightEdge) {
					// 좌우로 4칸씩 walkable 설정 (수평 타일 연결)
					if (isLeftEdge) {
						// 왼쪽으로 4칸
						for (let offset = 1; offset <= 4; offset++) {
							this.setWalkable(cellX + dx - offset, cellY - 2, true);

							if (offset === 4) {
								this.setWalkable(cellX + dx - offset, cellY - 1, true);
								this.setWalkable(cellX + dx - offset, cellY, true);
								this.setWalkable(cellX + dx - offset, cellY + 1, true);
								this.setWalkable(cellX + dx - offset, cellY + 2, true);
								this.setWalkable(cellX + dx - offset, cellY + 3, true);
								this.setWalkable(cellX + dx - offset, cellY + 4, true);
							}
						}
					}
					if (isRightEdge) {
						// 오른쪽으로 4칸
						for (let offset = 1; offset <= 4; offset++) {
							this.setWalkable(cellX + dx + offset, cellY - 2, true);

							if (offset === 4) {
								this.setWalkable(cellX + dx + offset, cellY - 1, true);
								this.setWalkable(cellX + dx + offset, cellY, true);
								this.setWalkable(cellX + dx + offset, cellY + 1, true);
								this.setWalkable(cellX + dx + offset, cellY + 2, true);
								this.setWalkable(cellX + dx + offset, cellY + 3, true);
								this.setWalkable(cellX + dx + offset, cellY + 4, true);
							}
						}
					}
				}
			}
		}
	}
}

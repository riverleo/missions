import { CELL_SIZE } from '$lib/constants';
import PF from 'pathfinding';
import type { Vector } from '$lib/utils/vector';
import type { WorldContext } from '../context';
import { initializeWalkable, setWalkable, setTileToUnwalkable } from './walkable';
import type { VectorKey } from '$lib/types';

export class Pathfinder {
	readonly grid: PF.Grid;
	readonly finder: PF.AStarFinder;
	readonly worldContext: WorldContext;
	readonly jumpZones: Set<VectorKey> = new Set();

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

	vectorToCell(vector: Vector) {
		return { x: this.pixelToCellIndex(vector.x), y: this.pixelToCellIndex(vector.y) };
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
	 * 픽셀 좌표로 경로 탐색 (결과도 픽셀 좌표)
	 */
	findPath(from: Vector, to: Vector): Vector[] {
		const startTileX = this.pixelToCellIndex(from.x);
		const startTileY = this.pixelToCellIndex(from.y);
		const endTileX = this.pixelToCellIndex(to.x);
		const endTileY = this.pixelToCellIndex(to.y);

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
	 * 해당 셀이 점프존인지 확인
	 */
	isJumpZone(vector: Vector): boolean {
		const cell = this.vectorToCell(vector);
		return this.jumpZones.has(`${cell.x},${cell.y}`);
	}

	/**
	 * worldContext의 타일들을 기반으로 전체 walkable 영역 업데이트
	 */
	update() {
		initializeWalkable(this);
		setWalkable(this);
		setTileToUnwalkable(this);
	}
}

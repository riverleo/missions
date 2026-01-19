import { get } from 'svelte/store';
import { vectorUtils } from '$lib/utils/vector';
import { useBuilding } from '$lib/hooks/use-building';
import { useWorld } from '$lib/hooks/use-world';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { CELL_SIZE, TILE_SIZE, BOUNDARY_THICKNESS } from '$lib/constants';
import type { WorldContext } from './world-context.svelte';
import type { WorldBlueprintCursor } from './index';
import type { BuildingId, CharacterId, ItemId, TileId, EntityTemplateId } from '$lib/types';
import type { Vector, Cell, ScreenVector, TileCell, TileCellKey } from '$lib/types/vector';
import type { WorldTileEntity } from '../entities/world-tile-entity';

export class WorldContextBlueprint {
	cursor = $state<WorldBlueprintCursor | undefined>(undefined);
	selectedEntityTemplateId = $state<EntityTemplateId | undefined>(undefined);
	// OPTIMIZATION: Set을 새로 생성해서 할당 (반응성 유지)
	cursorTileCellKeys = $state<Set<TileCellKey>>(new Set());
	// 겹치는 셀 캐시 (getOverlappingCells 결과를 캐시)
	overlappingCells = $state<Cell[]>([]);
	// 타일 범위 캐시 (calculateTileCells에서 계산, getOverlappingCells에서 재사용)
	private cursorTileBounds:
		| { minCol: number; maxCol: number; minRow: number; maxRow: number }
		| undefined = undefined;

	private context: WorldContext;

	constructor(context: WorldContext) {
		this.context = context;
	}

	/**
	 * 엔티티 템플릿 선택
	 */
	setSelectedEntityTemplateId(entityTemplateId: EntityTemplateId | undefined) {
		this.selectedEntityTemplateId = entityTemplateId;

		// 템플릿을 선택할 때만 엔티티 선택 해제
		if (entityTemplateId !== undefined) {
			useWorld().selectedEntityIdStore.update((state) => ({ ...state, entityId: undefined }));
		} else {
			// 템플릿 해제 시 캐시 클리어
			this.cursorTileBounds = undefined;
			this.overlappingCells = [];
		}
	}

	/**
	 * 마우스 위치에 따라 cursor 업데이트 (내부 구현)
	 */
	updateCursor(screenVector: ScreenVector) {
		if (!this.selectedEntityTemplateId) {
			this.cursor = undefined;
			this.cursorTileCellKeys = new Set();
			this.cursorTileBounds = undefined;
			this.overlappingCells = [];
			return;
		}

		const worldPos = this.context.camera.screenToWorld(screenVector);

		if (!worldPos) {
			this.cursor = undefined;
			this.cursorTileCellKeys = new Set();
			this.cursorTileBounds = undefined;
			this.overlappingCells = [];
			return;
		}

		const { type, value: id } = EntityIdUtils.template.parse(this.selectedEntityTemplateId);

		// type별로 스냅 위치 계산 (중복 체크를 위해)
		let vector: Vector;
		let cursorType: 'cell' | 'tile';

		if (type === 'building') {
			const { store: buildingStore } = useBuilding();
			const building = get(buildingStore).data[id as BuildingId];

			if (!building) {
				this.cursor = undefined;
				this.cursorTileCellKeys = new Set();
				this.cursorTileBounds = undefined;
				this.overlappingCells = [];
				return;
			}

			vector = vectorUtils.snapVectorByCell(worldPos, building.cell_cols, building.cell_rows);
			cursorType = 'cell';
		} else if (type === 'tile') {
			vector = vectorUtils.snapVectorByTile(worldPos);
			cursorType = 'tile';
		} else if (type === 'character' || type === 'item') {
			vector = vectorUtils.snapVectorByCell(worldPos, 1, 1);
			cursorType = 'cell';
		} else {
			this.cursor = undefined;
			this.cursorTileCellKeys = new Set();
			this.cursorTileBounds = undefined;
			this.overlappingCells = [];
			return;
		}

		// 위치가 같고 entityTemplateId가 같으면 중복 실행 방지 (반응성 트리거 방지)
		if (
			this.cursor &&
			this.cursor.current.x === vector.x &&
			this.cursor.current.y === vector.y &&
			this.cursor.entityTemplateId === this.selectedEntityTemplateId
		) {
			return;
		}

		// cursor 업데이트 (객체 재생성 대신 속성 업데이트)
		if (!this.cursor) {
			this.cursor = {
				entityTemplateId: this.selectedEntityTemplateId,
				current: vector,
				start: undefined,
				type: cursorType,
			};
		} else {
			// 기존 객체의 속성만 업데이트 (Proxy 오버헤드 감소)
			this.cursor.entityTemplateId = this.selectedEntityTemplateId;
			// Vector도 재사용 (객체 생성 최소화)
			this.cursor.current.x = vector.x;
			this.cursor.current.y = vector.y;
			this.cursor.type = cursorType;
			// start는 유지
		}

		// 타일이면 cursorTileCellKeys 계산
		if (type === 'tile') {
			this.calculateTileCells(this.cursor);
		} else {
			this.cursorTileCellKeys = new Set();
			this.cursorTileBounds = undefined;
		}

		// overlappingCells 갱신
		this.overlappingCells = this.getOverlappingCells();
	}

	/**
	 * 현재 배치하려는 건물/타일과 기존 건물들의 겹치는 셀들 + walkable이 아닌 셀들 계산
	 */
	getOverlappingCells(): Cell[] {
		if (!this.cursor || !this.context) {
			return [];
		}

		const { entityTemplateId, current } = this.cursor;
		const { x, y } = current;

		// 스토어 값들을 한 번만 조회
		const buildingStore = get(useBuilding().store).data;
		const worldBuildingStore = get(useWorld().worldBuildingStore).data;
		const worldTileMapStore = get(useWorld().worldTileMapStore).data;

		// 배치하려는 셀의 범위 계산 (객체 생성 대신 범위만)
		let targetMinCol: number;
		let targetMaxCol: number;
		let targetMinRow: number;
		let targetMaxRow: number;
		const isBuilding = EntityIdUtils.template.is('building', entityTemplateId);

		if (isBuilding) {
			const { value: buildingId } = EntityIdUtils.template.parse<BuildingId>(entityTemplateId);
			const building = buildingStore[buildingId];
			if (!building) return [];
			// 픽셀 좌표를 셀로 변환
			const cell = vectorUtils.vectorToCell({ x, y } as Vector);
			targetMinCol = cell.col;
			targetMaxCol = cell.col + building.cell_cols - 1;
			targetMinRow = cell.row;
			targetMaxRow = cell.row + building.cell_rows - 1;
		} else if (EntityIdUtils.template.is('tile', entityTemplateId)) {
			// 타일은 직사각형 영역이므로 캐시된 bounds 사용 (calculateTileCells에서 이미 계산됨)
			if (!this.cursorTileBounds) return [];

			const { minCol, maxCol, minRow, maxRow } = this.cursorTileBounds;

			// 타일 좌표를 셀 좌표로 변환 (1 tile = 2x2 cells)
			targetMinCol = minCol * 2;
			targetMaxCol = (maxCol + 1) * 2 - 1;
			targetMinRow = minRow * 2;
			targetMaxRow = (maxRow + 1) * 2 - 1;
		} else {
			return [];
		}

		// 기존 건물들이 차지하는 모든 셀을 Set으로 수집 (빠른 검색)
		const invalidCellSet = new Set<string>();

		// worldId 필터링
		const worldBuildings = Object.values(worldBuildingStore).filter(
			(b) => !this.context?.worldId || b.world_id === this.context.worldId
		);

		for (const worldBuilding of worldBuildings) {
			const buildingData = buildingStore[worldBuilding.building_id];
			if (!buildingData) continue;

			// 모든 셀 생성 대신 키만 Set에 추가
			for (let r = 0; r < buildingData.cell_rows; r++) {
				for (let c = 0; c < buildingData.cell_cols; c++) {
					invalidCellSet.add(`${worldBuilding.cell_x + c},${worldBuilding.cell_y + r}`);
				}
			}
		}

		// 기존 타일들이 차지하는 셀 수집 (1 tile = 2x2 cells)
		const worldTileMap = worldTileMapStore[this.context.worldId];
		if (worldTileMap) {
			for (const vector of Object.keys(worldTileMap.data)) {
				const [tileXStr, tileYStr] = vector.split(',');
				const tileX = parseInt(tileXStr!, 10);
				const tileY = parseInt(tileYStr!, 10);
				// 타일 좌표를 셀 좌표로 변환하여 2x2 셀 추가
				const cellX = tileX * 2;
				const cellY = tileY * 2;
				for (let r = 0; r < 2; r++) {
					for (let c = 0; c < 2; c++) {
						invalidCellSet.add(`${cellX + c},${cellY + r}`);
					}
				}
			}
		}

		// 건물인 경우 바닥이 타일이나 바닥 경계와 맞닿아있는지 확인
		let unsupported = false;
		if (isBuilding) {
			const { value: buildingId } = EntityIdUtils.template.parse<BuildingId>(entityTemplateId);
			const building = buildingStore[buildingId];
			if (building) {
				// 건물의 가장 아래 행 (픽셀 좌표)
				const cell = vectorUtils.vectorToCell({ x, y } as Vector);
				// 건물 바닥의 하단 = (바닥 행 + 1)의 상단
				const bottomPixelY =
					vectorUtils.cellIndexToPixel(cell.row + building.cell_rows) - CELL_SIZE / 2;

				// 모든 바닥 셀에 대해 각각 지지대 확인
				let supportedCount = 0;
				for (let col = cell.col; col < cell.col + building.cell_cols; col++) {
					const cellCenterX = vectorUtils.cellIndexToPixel(col);

					// 1. 타일과 맞닿아있는지 확인
					const tileEntities = Object.values(this.context.entities).filter(
						(entity): entity is WorldTileEntity => entity.type === 'tile'
					);

					let isSupported = false;
					for (const tileEntity of tileEntities) {
						const tileTopY = vectorUtils.tileIndexToPixel(tileEntity.tileY) - TILE_SIZE / 2;
						const tileLeftX = vectorUtils.tileIndexToPixel(tileEntity.tileX) - TILE_SIZE / 2;
						const tileRightX = tileLeftX + TILE_SIZE;

						if (
							Math.abs(bottomPixelY - tileTopY) < 1 &&
							cellCenterX >= tileLeftX &&
							cellCenterX <= tileRightX
						) {
							isSupported = true;
							break;
						}
					}

					// 2. 바닥 경계와 맞닿아있는지 확인
					if (!isSupported && this.context.boundaries) {
						const bottomTopY = this.context.boundaries.bottom.position.y - BOUNDARY_THICKNESS / 2;
						if (Math.abs(bottomPixelY - bottomTopY) < 1) {
							isSupported = true;
						}
					}

					if (isSupported) supportedCount++;
				}

				// 모든 바닥 셀이 지지대 위에 있지 않으면 설치 불가
				unsupported = supportedCount < building.cell_cols;
			}
		}

		// 범위 기반으로 겹침 체크 (Cell 객체 생성 없이)
		const overlappingCells: Cell[] = [];

		if (unsupported) {
			// 지지대 없으면 모든 타겟 셀이 겹침
			for (let r = targetMinRow; r <= targetMaxRow; r++) {
				for (let c = targetMinCol; c <= targetMaxCol; c++) {
					overlappingCells.push({ col: c, row: r } as Cell);
				}
			}
		} else {
			// 타겟 범위 내에서 invalidCellSet과 겹치는 셀만 찾기
			for (let r = targetMinRow; r <= targetMaxRow; r++) {
				for (let c = targetMinCol; c <= targetMaxCol; c++) {
					if (invalidCellSet.has(vectorUtils.createCellKey(c, r))) {
						overlappingCells.push({ col: c, row: r } as Cell);
					}
				}
			}
		}

		return overlappingCells;
	}

	/**
	 * 현재 배치가 유효한지 (겹치는 셀이 없는지)
	 */
	get placable(): boolean {
		return this.getOverlappingCells().length === 0;
	}

	/**
	 * cursor로부터 타일 셀 좌표들 계산
	 */
	private calculateTileCells(cursor: WorldBlueprintCursor): void {
		const { current, start } = cursor;

		// 픽셀 좌표를 타일 셀로 변환
		const currentTileCell = vectorUtils.vectorToTileCell(current);

		// 새로운 Set 생성 (반응성 트리거)
		const newSet = new Set<TileCellKey>();

		// start가 없으면 단일 타일
		if (!start) {
			const key = vectorUtils.createTileCellKey(currentTileCell);
			this.cursorTileBounds = {
				minCol: currentTileCell.col,
				maxCol: currentTileCell.col,
				minRow: currentTileCell.row,
				maxRow: currentTileCell.row,
			};
			newSet.add(key);
			this.cursorTileCellKeys = newSet;
			return;
		}

		const startTileCell = vectorUtils.vectorToTileCell(start);

		const dx = currentTileCell.col - startTileCell.col;
		const dy = currentTileCell.row - startTileCell.row;

		// 수평 직선 (dy === 0)
		if (dy === 0) {
			const minX = Math.min(startTileCell.col, currentTileCell.col);
			const maxX = Math.max(startTileCell.col, currentTileCell.col);
			this.cursorTileBounds = {
				minCol: minX,
				maxCol: maxX,
				minRow: startTileCell.row,
				maxRow: startTileCell.row,
			};
			for (let x = minX; x <= maxX; x++) {
				newSet.add(vectorUtils.createTileCellKey(x, startTileCell.row));
			}
			this.cursorTileCellKeys = newSet;
			return;
		}

		// 수직 직선 (dx === 0)
		if (dx === 0) {
			const minY = Math.min(startTileCell.row, currentTileCell.row);
			const maxY = Math.max(startTileCell.row, currentTileCell.row);
			this.cursorTileBounds = {
				minCol: startTileCell.col,
				maxCol: startTileCell.col,
				minRow: minY,
				maxRow: maxY,
			};
			for (let y = minY; y <= maxY; y++) {
				newSet.add(vectorUtils.createTileCellKey(startTileCell.col, y));
			}
			this.cursorTileCellKeys = newSet;
			return;
		}

		// 사각형 영역
		const minX = Math.min(startTileCell.col, currentTileCell.col);
		const maxX = Math.max(startTileCell.col, currentTileCell.col);
		const minY = Math.min(startTileCell.row, currentTileCell.row);
		const maxY = Math.max(startTileCell.row, currentTileCell.row);
		this.cursorTileBounds = {
			minCol: minX,
			maxCol: maxX,
			minRow: minY,
			maxRow: maxY,
		};
		for (let y = minY; y <= maxY; y++) {
			for (let x = minX; x <= maxX; x++) {
				newSet.add(vectorUtils.createTileCellKey(x, y));
			}
		}
		this.cursorTileCellKeys = newSet;
	}

	/**
	 * cursor의 start 설정/클리어
	 */
	setCursorStart(start: Vector | undefined) {
		if (!this.cursor) return;

		// CRITICAL: Vector를 복사해야 함 (cursor.current와 같은 객체를 참조하면 안됨)
		this.cursor.start = start ? ({ x: start.x, y: start.y } as Vector) : undefined;

		// 타일이면 cursorTileCellKeys 재계산
		if (this.cursor.type === 'tile') {
			this.calculateTileCells(this.cursor);
			// overlappingCells도 업데이트
			this.overlappingCells = this.getOverlappingCells();
		}
	}

	/**
	 * 커서 정보를 기반으로 엔티티를 월드에 배치
	 */
	cursorToEntities() {
		if (!this.cursor) return;

		const { entityTemplateId, current } = this.cursor;
		const { x, y } = current;
		const { type } = EntityIdUtils.template.parse(entityTemplateId);

		if (type === 'building') {
			// 겹치는 셀이 있으면 배치하지 않음
			if (!this.placable) return;
			// 픽셀 좌표를 셀로 변환
			const cell = vectorUtils.vectorToCell(current);
			this.context.createWorldBuilding({
				building_id: EntityIdUtils.template.id<BuildingId>(entityTemplateId),
				cell_x: cell.col,
				cell_y: cell.row,
			});
		} else if (type === 'tile') {
			// 겹치는 셀이 있으면 배치하지 않음
			if (!this.placable) return;
			// 타일 셀 좌표들 계산 (start가 있으면 범위, 없으면 단일)
			const tileId = EntityIdUtils.template.id<TileId>(entityTemplateId);
			const tiles: Record<TileCellKey, TileId> = {};
			for (const tileCellKey of this.cursorTileCellKeys) {
				tiles[tileCellKey] = tileId;
			}
			// 모든 타일을 한 번에 생성
			this.context.createTilesInWorldTileMap(tiles);
		} else if (type === 'character') {
			// current는 이미 픽셀 좌표
			this.context.createWorldCharacter({
				character_id: EntityIdUtils.template.id<CharacterId>(entityTemplateId),
				x: x + CELL_SIZE / 2,
				y: y + CELL_SIZE / 2,
			});
		} else if (type === 'item') {
			// current는 이미 픽셀 좌표
			this.context.createWorldItem({
				item_id: EntityIdUtils.template.id<ItemId>(entityTemplateId),
				x: x + CELL_SIZE / 2,
				y: y + CELL_SIZE / 2,
			});
		}
	}
}

import { useBuilding, useItem, useWorld } from '$lib/hooks';
import { get } from 'svelte/store';
import { vectorUtils } from '$lib/utils/vector';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { CELL_SIZE, TILE_SIZE, BOUNDARY_THICKNESS, MAX_TILE_PLACABLE_COUNT } from '$lib/constants';
import type { WorldContext } from './world-context.svelte';
import type { WorldBlueprintCursor } from './index';
import type { BuildingId, CharacterId, ItemId, TileId, EntitySourceTargetId } from '$lib/types';
import type { Vector, Cell, ScreenVector, TileCell, TileCellKey } from '$lib/types/vector';
import type { WorldTileEntity } from '../entities/world-tile-entity';

export class WorldContextBlueprint {
	cursor = $state<WorldBlueprintCursor | undefined>(undefined);

	private context: WorldContext;

	constructor(context: WorldContext) {
		this.context = context;
	}

	/**
	 * 엔티티 템플릿 선택
	 */
	setCursor(entitySourceTargetId: EntitySourceTargetId | undefined) {
		const { selectedEntityIdStore } = useWorld();

		if (entitySourceTargetId === undefined) {
			this.cursor = undefined;
			return;
		}

		// 템플릿을 선택할 때만 엔티티 선택 해제
		selectedEntityIdStore.update((state) => ({ ...state, entityId: undefined }));

		// cursor 초기화 (type은 updateCursor에서 설정)
		const { type } = EntityIdUtils.source.parse(entitySourceTargetId);
		this.cursor = {
			entitySourceTargetId,
			current: { x: 0, y: 0 } as Vector,
			start: undefined,
			type: type === 'tile' ? 'tile' : 'cell',
			tileCellKeys: new Set(),
			overlappingCells: [],
			tileBounds: undefined,
		};
	}

	/**
	 * 마우스 위치에 따라 cursor 업데이트 (내부 구현)
	 */
	updateCursor(screenVector: ScreenVector) {
		if (!this.cursor) {
			return;
		}

		const worldPos = this.context.camera.screenToWorld(screenVector);

		if (!worldPos) {
			return;
		}

		const { entitySourceTargetId } = this.cursor;
		const { type, value: id } = EntityIdUtils.source.parse(entitySourceTargetId);

		// type별로 스냅 위치 계산 (중복 체크를 위해)
		let vector: Vector;
		let cursorType: 'cell' | 'tile';

		if (type === 'building') {
			const { getOrUndefinedBuilding } = useBuilding();
			const building = getOrUndefinedBuilding(id as BuildingId);

			if (!building) {
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
			return;
		}

		// 위치가 같으면 중복 실행 방지 (반응성 트리거 방지)
		if (this.cursor.current.x === vector.x && this.cursor.current.y === vector.y) {
			return;
		}

		// cursor 업데이트 (Vector만 재사용, 객체 생성 최소화)
		this.cursor.current.x = vector.x;
		this.cursor.current.y = vector.y;
		this.cursor.type = cursorType;
		// start는 유지

		// 타일이면 tileCellKeys 계산
		if (type === 'tile') {
			this.calculateTileCells(this.cursor);
		} else {
			this.cursor.tileCellKeys = new Set();
			this.cursor.tileBounds = undefined;
		}

		// overlappingCells 갱신
		this.cursor.overlappingCells = this.getOverlappingCells();
	}

	/**
	 * 현재 배치하려는 건물/타일과 기존 건물들의 겹치는 셀들 + walkable이 아닌 셀들 계산
	 */
	private getOverlappingCells(): Cell[] {
		if (!this.cursor || !this.context) {
			return [];
		}

		const { entitySourceTargetId, current } = this.cursor;
		const { x, y } = current;

		// 스토어 값들을 한 번만 조회
		const { buildingStore, getBuilding } = useBuilding();
		const { worldBuildingStore, worldTileMapStore } = useWorld();

		const buildingStoreData = get(buildingStore).data;
		const worldBuildingStoreData = get(worldBuildingStore).data;
		const worldTileMapStoreData = get(worldTileMapStore).data;

		// 배치하려는 셀의 범위 계산 (객체 생성 대신 범위만)
		let targetMinCol: number;
		let targetMaxCol: number;
		let targetMinRow: number;
		let targetMaxRow: number;
		const isBuilding = EntityIdUtils.source.is('building', entitySourceTargetId);

		if (isBuilding) {
			const { value: buildingId } = EntityIdUtils.source.parse<BuildingId>(entitySourceTargetId);
			const building = buildingStoreData[buildingId];
			if (!building) return [];
			// 픽셀 좌표를 셀로 변환
			const cell = vectorUtils.vectorToCell({ x, y } as Vector);
			targetMinCol = cell.col;
			targetMaxCol = cell.col + building.cell_cols - 1;
			targetMinRow = cell.row;
			targetMaxRow = cell.row + building.cell_rows - 1;
		} else if (EntityIdUtils.source.is('tile', entitySourceTargetId)) {
			// 타일은 직사각형 영역이므로 캐시된 bounds 사용 (calculateTileCells에서 이미 계산됨)
			if (!this.cursor.tileBounds) return [];

			const { start, end } = this.cursor.tileBounds;

			// 타일 좌표를 셀 좌표로 변환 (1 tile = 2x2 cells)
			targetMinCol = start.col * 2;
			targetMaxCol = (end.col + 1) * 2 - 1;
			targetMinRow = start.row * 2;
			targetMaxRow = (end.row + 1) * 2 - 1;
		} else {
			return [];
		}

		// 기존 건물들이 차지하는 모든 셀을 Set으로 수집 (빠른 검색)
		const invalidCellSet = new Set<string>();

		// worldId 필터링
		const worldBuildings = Object.values(worldBuildingStoreData).filter(
			(b) => !this.context?.worldId || b.world_id === this.context.worldId
		);

		for (const worldBuilding of worldBuildings) {
			const buildingData = buildingStoreData[worldBuilding.building_id];
			if (!buildingData) continue;

			// 모든 셀 생성 대신 키만 Set에 추가
			for (let r = 0; r < buildingData.cell_rows; r++) {
				for (let c = 0; c < buildingData.cell_cols; c++) {
					invalidCellSet.add(`${worldBuilding.cell_x + c},${worldBuilding.cell_y + r}`);
				}
			}
		}

		// 기존 타일들이 차지하는 셀 수집 (1 tile = 2x2 cells)
		const worldTileMap = worldTileMapStoreData[this.context.worldId];
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
			const { value: buildingId } = EntityIdUtils.source.parse<BuildingId>(entitySourceTargetId);
			const building = buildingStoreData[buildingId];
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
			// 지지대 없으면 모든 대상 셀이 겹침
			for (let r = targetMinRow; r <= targetMaxRow; r++) {
				for (let c = targetMinCol; c <= targetMaxCol; c++) {
					overlappingCells.push(vectorUtils.createCell(c, r));
				}
			}
		} else {
			// 대상 범위 내에서 invalidCellSet과 겹치는 셀만 찾기
			for (let r = targetMinRow; r <= targetMaxRow; r++) {
				for (let c = targetMinCol; c <= targetMaxCol; c++) {
					if (invalidCellSet.has(vectorUtils.createCellKey(c, r))) {
						overlappingCells.push(vectorUtils.createCell(c, r));
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
		return (this.cursor?.overlappingCells.length ?? 0) === 0;
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
			cursor.tileBounds = {
				start: { col: currentTileCell.col, row: currentTileCell.row } as TileCell,
				end: { col: currentTileCell.col, row: currentTileCell.row } as TileCell,
			};
			newSet.add(key);
			cursor.tileCellKeys = newSet;
			return;
		}

		const startTileCell = vectorUtils.vectorToTileCell(start);

		const dx = currentTileCell.col - startTileCell.col;
		const dy = currentTileCell.row - startTileCell.row;

		// 수평 직선 (dy === 0)
		if (dy === 0) {
			const minX = Math.min(startTileCell.col, currentTileCell.col);
			let maxX = Math.max(startTileCell.col, currentTileCell.col);
			const tileCount = maxX - minX + 1;

			// 최대 갯수 초과 시 200개까지만 표시
			if (tileCount > MAX_TILE_PLACABLE_COUNT) {
				maxX = minX + MAX_TILE_PLACABLE_COUNT - 1;
			}

			cursor.tileBounds = {
				start: { col: minX, row: startTileCell.row } as TileCell,
				end: { col: maxX, row: startTileCell.row } as TileCell,
			};
			for (let x = minX; x <= maxX; x++) {
				newSet.add(vectorUtils.createTileCellKey(x, startTileCell.row));
			}
			cursor.tileCellKeys = newSet;
			return;
		}

		// 수직 직선 (dx === 0)
		if (dx === 0) {
			const minY = Math.min(startTileCell.row, currentTileCell.row);
			let maxY = Math.max(startTileCell.row, currentTileCell.row);
			const tileCount = maxY - minY + 1;

			// 최대 갯수 초과 시 200개까지만 표시
			if (tileCount > MAX_TILE_PLACABLE_COUNT) {
				maxY = minY + MAX_TILE_PLACABLE_COUNT - 1;
			}

			cursor.tileBounds = {
				start: { col: startTileCell.col, row: minY } as TileCell,
				end: { col: startTileCell.col, row: maxY } as TileCell,
			};
			for (let y = minY; y <= maxY; y++) {
				newSet.add(vectorUtils.createTileCellKey(startTileCell.col, y));
			}
			cursor.tileCellKeys = newSet;
			return;
		}

		// 사각형 영역
		const minX = Math.min(startTileCell.col, currentTileCell.col);
		let maxX = Math.max(startTileCell.col, currentTileCell.col);
		const minY = Math.min(startTileCell.row, currentTileCell.row);
		let maxY = Math.max(startTileCell.row, currentTileCell.row);

		// X 방향 폭 계산 및 제한
		let width = maxX - minX + 1;
		if (width > MAX_TILE_PLACABLE_COUNT) {
			width = MAX_TILE_PLACABLE_COUNT;
			maxX = minX + width - 1;
		}

		// Y 방향 높이 제한 (X 방향 폭에 맞춰서)
		const maxRows = Math.floor(MAX_TILE_PLACABLE_COUNT / width);
		const height = maxY - minY + 1;
		if (height > maxRows) {
			maxY = minY + maxRows - 1;
		}

		cursor.tileBounds = {
			start: { col: minX, row: minY } as TileCell,
			end: { col: maxX, row: maxY } as TileCell,
		};
		for (let y = minY; y <= maxY; y++) {
			for (let x = minX; x <= maxX; x++) {
				newSet.add(vectorUtils.createTileCellKey(x, y));
			}
		}
		cursor.tileCellKeys = newSet;
	}

	/**
	 * cursor의 start 설정/클리어
	 */
	setCursorStart(start: Vector | undefined) {
		if (!this.cursor) return;

		// CRITICAL: Vector를 복사해야 함 (cursor.current와 같은 객체를 참조하면 안됨)
		this.cursor.start = start ? ({ x: start.x, y: start.y } as Vector) : undefined;

		// 타일이면 tileCellKeys 재계산
		if (this.cursor.type === 'tile') {
			this.calculateTileCells(this.cursor);
			// overlappingCells도 업데이트
			this.cursor.overlappingCells = this.getOverlappingCells();
		}
	}

	/**
	 * 커서 정보를 기반으로 엔티티를 월드에 배치
	 */
	cursorToEntities() {
		if (!this.cursor) return;

		const { entitySourceTargetId, current } = this.cursor;
		const { x, y } = current;
		const { type } = EntityIdUtils.source.parse(entitySourceTargetId);

		if (type === 'building') {
			// 겹치는 셀이 있으면 배치하지 않음
			if (!this.placable) return;
			// 픽셀 좌표를 셀로 변환
			const cell = vectorUtils.vectorToCell(current);
			this.context.createWorldBuilding({
				building_id: EntityIdUtils.source.id<BuildingId>(entitySourceTargetId),
				cell_x: cell.col,
				cell_y: cell.row,
			});
		} else if (type === 'tile') {
			// 겹치는 셀이 있으면 배치하지 않음
			if (!this.placable) return;
			// 타일 셀 좌표들 계산 (start가 있으면 범위, 없으면 단일)
			const tileId = EntityIdUtils.source.id<TileId>(entitySourceTargetId);
			const tiles: Record<TileCellKey, TileId> = {};
			for (const tileCellKey of this.cursor.tileCellKeys) {
				tiles[tileCellKey] = tileId;
			}
			// 모든 타일을 한 번에 생성
			this.context.createTilesInWorldTileMap(tiles);
		} else if (type === 'character') {
			// current는 이미 픽셀 좌표
			this.context.createWorldCharacter({
				character_id: EntityIdUtils.source.id<CharacterId>(entitySourceTargetId),
				x: x + CELL_SIZE / 2,
				y: y + CELL_SIZE / 2,
			});
		} else if (type === 'item') {
			// current는 이미 픽셀 좌표
			const itemId = EntityIdUtils.source.id<ItemId>(entitySourceTargetId);
			const { getOrUndefinedItem } = useItem();
			const item = getOrUndefinedItem(itemId);

			this.context.createWorldItem({
				item_id: itemId,
				x: x + CELL_SIZE / 2,
				y: y + CELL_SIZE / 2,
				world_building_id: null,
				world_character_id: null,
				durability_ticks: item?.max_durability_ticks ?? null,
			});
		}
	}
}

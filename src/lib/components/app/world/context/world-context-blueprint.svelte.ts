import { get } from 'svelte/store';
import { throttle } from 'radash';
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

	private context: WorldContext;

	// 타일 엔티티 캐싱
	private tileEntities = $derived.by(() => {
		return Object.values(this.context.entities).filter(
			(entity): entity is WorldTileEntity => entity.type === 'tile'
		);
	});

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
		}
	}

	/**
	 * 마우스 위치에 따라 cursor 업데이트 (내부 구현)
	 */
	updateCursor(screenVector: ScreenVector) {
		if (!this.selectedEntityTemplateId) {
			this.cursor = undefined;
			return;
		}

		const { type, value: id } = EntityIdUtils.template.parse(this.selectedEntityTemplateId);
		const worldPos = this.context.camera.screenToWorld(screenVector);

		if (!worldPos) {
			this.cursor = undefined;
			return;
		}

		const { store: buildingStore } = useBuilding();
		const buildings = get(buildingStore).data;

		if (type === 'building') {
			const building = buildings[id as BuildingId];

			if (!building) {
				this.cursor = undefined;
				return;
			}

			const vector = vectorUtils.snapVectorByCell(worldPos, building.cell_cols, building.cell_rows);

			this.cursor = {
				entityTemplateId: this.selectedEntityTemplateId,
				current: vector,
				start: this.cursor?.start,
				type: 'cell',
			};
		} else if (type === 'tile') {
			const vector = vectorUtils.snapVectorByTile(worldPos);

			this.cursor = {
				entityTemplateId: this.selectedEntityTemplateId,
				current: vector,
				start: this.cursor?.start,
				type: 'tile',
			};
		} else if (type === 'character' || type === 'item') {
			const vector = vectorUtils.snapVectorByCell(worldPos, 1, 1);
			this.cursor = {
				entityTemplateId: this.selectedEntityTemplateId,
				current: vector,
				start: this.cursor?.start,
				type: 'cell',
			};
		} else {
			this.cursor = undefined;
		}
	}

	/**
	 * 현재 배치하려는 건물/타일과 기존 건물들의 겹치는 셀들 + walkable이 아닌 셀들 계산
	 */
	getOverlappingCells(): Cell[] {
		if (!this.cursor || !this.context) return [];

		const { entityTemplateId, current } = this.cursor;
		const { x, y } = current;

		// 스토어 값들을 한 번만 조회
		const buildingStore = get(useBuilding().store).data;
		const worldBuildingStore = get(useWorld().worldBuildingStore).data;
		const worldTileMapStore = get(useWorld().worldTileMapStore).data;

		// 배치하려는 셀 계산
		let targetCells: Cell[];
		const isBuilding = EntityIdUtils.template.is('building', entityTemplateId);

		if (isBuilding) {
			const { value: buildingId } = EntityIdUtils.template.parse<BuildingId>(entityTemplateId);
			const building = buildingStore[buildingId];
			if (!building) return [];
			// 픽셀 좌표를 셀로 변환
			const cell = vectorUtils.vectorToCell({ x, y } as Vector);
			targetCells = vectorUtils.createCells(
				cell.col,
				cell.row,
				building.cell_cols,
				building.cell_rows
			);
		} else if (EntityIdUtils.template.is('tile', entityTemplateId)) {
			// 모든 타일 셀을 가져와서 각각의 2x2 셀을 targetCells에 추가
			const tileCells = this.getTileCellsFromStart();
			targetCells = [];
			for (const tileCell of tileCells) {
				const cellX = tileCell.col * 2;
				const cellY = tileCell.row * 2;
				const cells = vectorUtils.createCells(cellX, cellY, 2, 2);
				targetCells.push(...cells);
			}
		} else {
			return [];
		}

		// 기존 건물들이 차지하는 모든 셀 수집
		const invalidCells: Cell[] = [];

		// worldId 필터링
		const worldBuildings = Object.values(worldBuildingStore).filter(
			(b) => !this.context?.worldId || b.world_id === this.context.worldId
		);

		for (const worldBuilding of worldBuildings) {
			const buildingData = buildingStore[worldBuilding.building_id];
			if (!buildingData) continue;

			const cells = vectorUtils.createCells(
				worldBuilding.cell_x,
				worldBuilding.cell_y,
				buildingData.cell_cols,
				buildingData.cell_rows
			);
			invalidCells.push(...cells);
		}

		// 기존 타일들이 차지하는 셀 수집 (1 tile = 2x2 cells)
		const worldTileMap = worldTileMapStore[this.context.worldId];
		if (worldTileMap) {
			for (const vector of Object.keys(worldTileMap.data)) {
				const [tileXStr, tileYStr] = vector.split(',');
				const tileX = parseInt(tileXStr!, 10);
				const tileY = parseInt(tileYStr!, 10);
				// 타일 좌표를 셀 좌표로 변환
				const cellX = tileX * 2;
				const cellY = tileY * 2;
				const cells = vectorUtils.createCells(cellX, cellY, 2, 2);
				invalidCells.push(...cells);
			}
		}

		// 건물인 경우 바닥이 타일이나 바닥 경계와 맞닿아있는지 확인
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
				const bottomCols = [];
				for (let col = cell.col; col < cell.col + building.cell_cols; col++) {
					bottomCols.push(col);
				}

				const allSupported = bottomCols.every((col) => {
					const cellCenterX = vectorUtils.cellIndexToPixel(col);

					// 1. 타일과 맞닿아있는지 확인
					const tileEntities = this.tileEntities;

					for (const tileEntity of tileEntities) {
						const tileTopY = vectorUtils.tileIndexToPixel(tileEntity.tileY) - TILE_SIZE / 2;
						const tileLeftX = vectorUtils.tileIndexToPixel(tileEntity.tileX) - TILE_SIZE / 2;
						const tileRightX = tileLeftX + TILE_SIZE;

						if (
							Math.abs(bottomPixelY - tileTopY) < 1 &&
							cellCenterX >= tileLeftX &&
							cellCenterX <= tileRightX
						) {
							return true;
						}
					}

					// 2. 바닥 경계와 맞닿아있는지 확인
					if (this.context.boundaries) {
						const bottomTopY = this.context.boundaries.bottom.position.y - BOUNDARY_THICKNESS / 2;
						if (Math.abs(bottomPixelY - bottomTopY) < 1) {
							return true;
						}
					}

					return false;
				});

				// 모든 바닥 셀이 지지대 위에 있지 않으면 설치 불가
				if (!allSupported) {
					invalidCells.push(...targetCells);
				}
			}
		}

		return vectorUtils.getOverlappingCells(targetCells, invalidCells);
	}

	/**
	 * 현재 배치가 유효한지 (겹치는 셀이 없는지)
	 */
	get placable(): boolean {
		return this.getOverlappingCells().length === 0;
	}

	private count = 0;
	/**
	 * 타일 배치용 타일 셀 좌표 계산 (start → current)
	 * - 수평/수직: 직선
	 * - 그 외: 사각형 영역
	 */
	getTileCellsFromStart(): TileCell[] {
		if (!this.cursor) return [];
		console.log('getTileCellsFromStart', this.count++);

		const { current, start } = this.cursor;

		// 픽셀 좌표를 타일 셀로 변환
		const currentTileCell = vectorUtils.vectorToTileCell(current);

		// start가 없으면 단일 타일
		if (!start) {
			return [currentTileCell];
		}

		const startTileCell = vectorUtils.vectorToTileCell(start);

		const dx = currentTileCell.col - startTileCell.col;
		const dy = currentTileCell.row - startTileCell.row;

		// 수평 직선 (dy === 0)
		if (dy === 0) {
			const minX = Math.min(startTileCell.col, currentTileCell.col);
			const maxX = Math.max(startTileCell.col, currentTileCell.col);
			const tileCells: TileCell[] = [];
			for (let x = minX; x <= maxX; x++) {
				tileCells.push(vectorUtils.createTileCell(x, startTileCell.row));
			}
			return tileCells;
		}

		// 수직 직선 (dx === 0)
		if (dx === 0) {
			const minY = Math.min(startTileCell.row, currentTileCell.row);
			const maxY = Math.max(startTileCell.row, currentTileCell.row);
			const tileCells: TileCell[] = [];
			for (let y = minY; y <= maxY; y++) {
				tileCells.push(vectorUtils.createTileCell(startTileCell.col, y));
			}
			return tileCells;
		}

		// 사각형 영역
		const minX = Math.min(startTileCell.col, currentTileCell.col);
		const maxX = Math.max(startTileCell.col, currentTileCell.col);
		const minY = Math.min(startTileCell.row, currentTileCell.row);
		const maxY = Math.max(startTileCell.row, currentTileCell.row);
		const tileCells: TileCell[] = [];
		for (let y = minY; y <= maxY; y++) {
			for (let x = minX; x <= maxX; x++) {
				tileCells.push(vectorUtils.createTileCell(x, y));
			}
		}
		return tileCells;
	}

	/**
	 * cursor의 start 설정/클리어
	 */
	setCursorStart(start: Vector | undefined) {
		if (!this.cursor) return;
		this.cursor = {
			...this.cursor,
			start,
		};
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
			for (const tileCell of this.getTileCellsFromStart()) {
				const tileCellKey = vectorUtils.createTileCellKey(tileCell);
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

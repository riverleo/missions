import { get } from 'svelte/store';
import { vectorUtils } from '$lib/utils/vector';
import { useBuilding } from '$lib/hooks/use-building';
import { useWorld } from '$lib/hooks/use-world';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { CELL_SIZE } from '$lib/constants';
import type { WorldContext } from './world-context.svelte';
import type { WorldBlueprintCursor } from './index';
import type { BuildingId, CharacterId, ItemId, TileId, EntityTemplateId } from '$lib/types';
import type { Vector, Cell, ScreenVector } from '$lib/types/vector';

export class WorldContextBlueprint {
	cursor = $state<WorldBlueprintCursor | undefined>(undefined);
	selectedEntityTemplateId = $state<EntityTemplateId | undefined>(undefined);

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
		}
	}

	/**
	 * 마우스 위치에 따라 cursor 업데이트
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

		// 배치하려는 셀 계산
		let targetCells: Cell[];
		const isBuilding = EntityIdUtils.template.is('building', entityTemplateId);

		if (isBuilding) {
			const { value: buildingId } = EntityIdUtils.template.parse<BuildingId>(entityTemplateId);
			const buildingStore = get(useBuilding().store).data;
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
			// 픽셀 좌표를 타일 셀로 변환 → 셀 좌표로 변환 (1 tile = 2x2 cells)
			const tileCell = vectorUtils.vectorToTileCell({ x, y } as Vector);
			const cellX = tileCell.col * 2;
			const cellY = tileCell.row * 2;
			targetCells = vectorUtils.createCells(cellX, cellY, 2, 2);
		} else {
			return [];
		}

		// 기존 건물들이 차지하는 모든 셀 수집
		const buildingStore = get(useBuilding().store).data;
		const worldBuildingStore = get(useWorld().worldBuildingStore).data;
		const worldTileMapStore = get(useWorld().worldTileMapStore).data;
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

		// 건물인 경우 바닥이 타일/바닥과 맞닿아있는지 확인
		if (isBuilding) {
			const { value: buildingId } = EntityIdUtils.template.parse<BuildingId>(entityTemplateId);
			const buildingStore = get(useBuilding().store).data;
			const building = buildingStore[buildingId];
			if (building) {
				// 건물의 가장 아래 행
				const bottomRow = targetCells[0]!.row + building.cell_rows - 1;

				// 가장 아래 행의 모든 셀에 대해 바로 아래가 unwalkable(타일/바닥)인지 확인
				let hasSupport = false;
				for (const cell of targetCells) {
					if (cell.row === bottomRow) {
						const belowIsUnwalkable = !this.context.pathfinder.grid.isWalkableAt(cell.col, cell.row + 1);
						if (belowIsUnwalkable) {
							hasSupport = true;
							break;
						}
					}
				}

				// 지지대가 없으면 모든 셀을 invalid로 추가
				if (!hasSupport) {
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

	/**
	 * 타일 배치용 벡터 계산 (start → current)
	 * - 수평/수직: 직선
	 * - 그 외: 사각형 영역
	 */
	getVectorsFromStart(): Vector[] {
		if (!this.cursor) return [];

		const { current, start } = this.cursor;

		// start가 없으면 단일 타일
		if (!start) {
			return [current];
		}

		const dx = current.x - start.x;
		const dy = current.y - start.y;

		// 수평 직선 (dy === 0)
		if (dy === 0) {
			const minX = Math.min(start.x, current.x);
			const maxX = Math.max(start.x, current.x);
			const vectors: Vector[] = [];
			for (let x = minX; x <= maxX; x++) {
				vectors.push(vectorUtils.createVector(x, start.y));
			}
			return vectors;
		}

		// 수직 직선 (dx === 0)
		if (dx === 0) {
			const minY = Math.min(start.y, current.y);
			const maxY = Math.max(start.y, current.y);
			const vectors: Vector[] = [];
			for (let y = minY; y <= maxY; y++) {
				vectors.push(vectorUtils.createVector(start.x, y));
			}
			return vectors;
		}

		// 사각형 영역
		const minX = Math.min(start.x, current.x);
		const maxX = Math.max(start.x, current.x);
		const minY = Math.min(start.y, current.y);
		const maxY = Math.max(start.y, current.y);
		const vectors: Vector[] = [];
		for (let y = minY; y <= maxY; y++) {
			for (let x = minX; x <= maxX; x++) {
				vectors.push(vectorUtils.createVector(x, y));
			}
		}
		return vectors;
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
	async cursorToEntities() {
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
			// 타일 벡터들 계산 (start가 있으면 범위, 없으면 단일)
			for (const pixelVector of this.getVectorsFromStart()) {
				// 픽셀 좌표를 타일 셀로 변환 후 Vector로 변환 (createTileInWorldTileMap이 Vector 기대)
				const tileCell = vectorUtils.vectorToTileCell(pixelVector);
				const tileVector = vectorUtils.createVector(tileCell.col, tileCell.row);
				await this.context.createTileInWorldTileMap(
					EntityIdUtils.template.id<TileId>(entityTemplateId),
					tileVector
				);
			}
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

import { get } from 'svelte/store';
import { createVectors, getOverlappingVectors, pointToTopLeft, type Vector } from '$lib/utils/vector';
import { useBuilding } from '$lib/hooks/use-building';
import { useWorld } from '$lib/hooks/use-world';
import { EntityIdUtils } from '$lib/utils/entity-id';
import { TILE_SIZE, CELL_SIZE } from '$lib/constants';
import type { WorldContext } from './world-context.svelte';
import type { WorldBlueprintCursor } from './index';
import type { BuildingId, EntityTemplateId } from '$lib/types';

export type GridType = 'tile' | 'cell';

export class WorldContextBlueprint {
	cursor = $state<WorldBlueprintCursor | undefined>(undefined);
	gridType = $state<GridType>('cell');
	selectedEntityTemplateId = $state<EntityTemplateId | undefined>(undefined);

	private context: WorldContext;

	constructor(context: WorldContext) {
		this.context = context;
	}

	/**
	 * 엔티티 템플릿 선택 (토글 방식)
	 */
	setSelectedEntityTemplateId(entityTemplateId: EntityTemplateId | undefined) {
		// 토글 방식: 같은 것을 선택하면 해제
		this.selectedEntityTemplateId =
			this.selectedEntityTemplateId === entityTemplateId ? undefined : entityTemplateId;

		// useWorld의 selectedEntityIdStore 클리어
		useWorld().selectedEntityIdStore.update((state) => ({ ...state, entityId: undefined }));
	}

	/**
	 * 마우스 위치에 따라 cursor 업데이트
	 */
	updateCursor(clientX: number, clientY: number) {
		if (!this.selectedEntityTemplateId) {
			this.cursor = undefined;
			this.gridType = 'cell';
			return;
		}

		const { type, value: id } = EntityIdUtils.template.parse(this.selectedEntityTemplateId);
		const worldPos = this.context.camera.screenToWorld(clientX, clientY);

		if (!worldPos) {
			this.cursor = undefined;
			this.gridType = 'cell';
			return;
		}

		const { store: buildingStore } = useBuilding();
		const buildings = get(buildingStore).data;

		if (type === 'building') {
			const building = buildings[id as BuildingId];
			if (!building) {
				this.cursor = undefined;
				this.gridType = 'cell';
				return;
			}

			const { x, y } = pointToTopLeft(
				worldPos.x,
				worldPos.y,
				building.cell_cols,
				building.cell_rows,
				CELL_SIZE
			);
			this.cursor = {
				entityTemplateId: this.selectedEntityTemplateId,
				x,
				y,
			};
			this.gridType = 'cell';
		} else if (type === 'tile') {
			const { x, y } = pointToTopLeft(worldPos.x, worldPos.y, 1, 1, TILE_SIZE);
			this.cursor = {
				entityTemplateId: this.selectedEntityTemplateId,
				x,
				y,
			};
			this.gridType = 'tile';
		} else if (type === 'character' || type === 'item') {
			const { x, y } = pointToTopLeft(worldPos.x, worldPos.y, 1, 1, CELL_SIZE);
			this.cursor = {
				entityTemplateId: this.selectedEntityTemplateId,
				x,
				y,
			};
			this.gridType = 'cell';
		} else {
			this.cursor = undefined;
			this.gridType = 'cell';
		}
	}

	/**
	 * 현재 배치하려는 건물/타일과 기존 건물들의 겹치는 셀들 계산
	 */
	getOverlappingVectors(): Vector[] {
		if (!this.cursor || !this.context) return [];

		const { entityTemplateId, x, y } = this.cursor;

		// 배치하려는 셀 계산
		let targetVectors: Vector[];
		if (EntityIdUtils.template.is('building', entityTemplateId)) {
			const { value: buildingId } = EntityIdUtils.template.parse<BuildingId>(entityTemplateId);
			const buildingStore = get(useBuilding().store).data;
			const building = buildingStore[buildingId];
			if (!building) return [];
			targetVectors = createVectors(x, y, building.cell_cols, building.cell_rows);
		} else if (EntityIdUtils.template.is('tile', entityTemplateId)) {
			// 타일 좌표를 셀 좌표로 변환 (1 tile = 2x2 cells)
			const cellX = x * 2;
			const cellY = y * 2;
			targetVectors = createVectors(cellX, cellY, 2, 2);
		} else {
			return [];
		}

		// 기존 건물들이 차지하는 모든 셀 수집
		const buildingStore = get(useBuilding().store).data;
		const worldBuildingStore = get(useWorld().worldBuildingStore).data;
		const worldTileMapStore = get(useWorld().worldTileMapStore).data;
		const existingVectors: Vector[] = [];

		// worldId 필터링
		const worldBuildings = Object.values(worldBuildingStore).filter(
			(b) => !this.context?.worldId || b.world_id === this.context.worldId
		);

		for (const worldBuilding of worldBuildings) {
			const buildingData = buildingStore[worldBuilding.building_id];
			if (!buildingData) continue;

			const cells = createVectors(
				worldBuilding.cell_x,
				worldBuilding.cell_y,
				buildingData.cell_cols,
				buildingData.cell_rows
			);
			existingVectors.push(...cells);
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
				const cells = createVectors(cellX, cellY, 2, 2);
				existingVectors.push(...cells);
			}
		}

		return getOverlappingVectors(targetVectors, existingVectors);
	}

	/**
	 * 현재 배치가 유효한지 (겹치는 셀이 없는지)
	 */
	get placable(): boolean {
		return this.getOverlappingVectors().length === 0;
	}
}

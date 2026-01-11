import { get } from 'svelte/store';
import { createVectors, getOverlappingVectors, type Vector } from '$lib/utils/vector';
import { useBuilding } from '$lib/hooks/use-building';
import { useWorld } from '$lib/hooks/use-world';
import { EntityIdUtils } from '$lib/utils/entity-id';
import type { WorldContext } from './world-context.svelte';
import type { WorldBlueprintCursor } from './index';
import type { BuildingId } from '$lib/types';

export type GridType = 'tile' | 'cell';

export class WorldContextBlueprint {
	cursor = $state<WorldBlueprintCursor | undefined>(undefined);
	gridType = $state<GridType>('cell');

	private context: WorldContext;

	constructor(context: WorldContext) {
		this.context = context;
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

import { get } from 'svelte/store';
import { getBuildingOccupiedCells, getOverlappingCells, type TileCell } from '../tiles';
import { useBuilding } from '$lib/hooks/use-building';
import { useWorld } from '$lib/hooks/use-world';
import { EntityIdUtils } from '$lib/utils/entity-id';
import type { WorldContext } from './world-context.svelte';
import type { WorldBlueprintCursor } from './index';
import type { BuildingId } from '$lib/types';

export class WorldContextBlueprint {
	cursor = $state<WorldBlueprintCursor | undefined>(undefined);

	private context: WorldContext;

	constructor(context: WorldContext) {
		this.context = context;
	}

	/**
	 * 현재 배치하려는 건물/타일과 기존 건물들의 겹치는 셀들 계산
	 */
	getOverlappingCells(): TileCell[] {
		if (!this.cursor || !this.context) return [];

		const { entityTemplateId, tileX, tileY } = this.cursor;

		// 배치하려는 셀 계산
		let targetTileCells: TileCell[];
		if (EntityIdUtils.template.is('building', entityTemplateId)) {
			const { value: buildingId } = EntityIdUtils.template.parse<BuildingId>(entityTemplateId);
			const buildingStore = get(useBuilding().store).data;
			const building = buildingStore[buildingId];
			if (!building) return [];
			targetTileCells = getBuildingOccupiedCells(
				tileX,
				tileY,
				building.tile_cols,
				building.tile_rows
			);
		} else if (EntityIdUtils.template.is('tile', entityTemplateId)) {
			// 타일은 1x1
			targetTileCells = getBuildingOccupiedCells(tileX, tileY, 1, 1);
		} else {
			return [];
		}

		// 기존 건물들이 차지하는 모든 셀 수집
		const buildingStore = get(useBuilding().store).data;
		const worldBuildingStore = get(useWorld().worldBuildingStore).data;
		const worldTileMapStore = get(useWorld().worldTileMapStore).data;
		const existingTileCells: TileCell[] = [];

		// worldId 필터링
		const worldBuildings = Object.values(worldBuildingStore).filter(
			(b) => !this.context?.worldId || b.world_id === this.context.worldId
		);

		for (const worldBuilding of worldBuildings) {
			const buildingData = buildingStore[worldBuilding.building_id];
			if (!buildingData) continue;

			const cells = getBuildingOccupiedCells(
				worldBuilding.tile_x,
				worldBuilding.tile_y,
				buildingData.tile_cols,
				buildingData.tile_rows
			);
			existingTileCells.push(...cells);
		}

		// 기존 타일들이 차지하는 셀 수집
		const worldTileMap = worldTileMapStore[this.context.worldId];
		if (worldTileMap) {
			for (const vector of Object.keys(worldTileMap.data)) {
				const [tileXStr, tileYStr] = vector.split(',');
				const tileCellX = parseInt(tileXStr, 10);
				const tileCellY = parseInt(tileYStr, 10);
				existingTileCells.push({ col: tileCellX, row: tileCellY });
			}
		}

		return getOverlappingCells(targetTileCells, existingTileCells);
	}

	/**
	 * 현재 배치가 유효한지 (겹치는 셀이 없는지)
	 */
	get placable(): boolean {
		return this.getOverlappingCells().length === 0;
	}
}

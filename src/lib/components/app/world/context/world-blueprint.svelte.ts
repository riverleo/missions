import { get } from 'svelte/store';
import { getBuildingOccupiedCells, getOverlappingCells, type TileCell } from '../tiles';
import { useBuilding } from '$lib/hooks/use-building';
import { useWorld } from '$lib/hooks/use-world';
import type { WorldContext } from './world-context.svelte';
import type { WorldBlueprintCursor } from './index';

export class WorldBlueprint {
	cursor = $state<WorldBlueprintCursor | undefined>(undefined);

	private context: WorldContext;

	constructor(context: WorldContext) {
		this.context = context;
	}

	/**
	 * 현재 배치하려는 건물과 기존 건물들의 겹치는 셀들 계산
	 */
	getOverlappingCells(): TileCell[] {
		if (!this.cursor || !this.context) return [];

		const { building, tileX, tileY } = this.cursor;
		const placementCells = getBuildingOccupiedCells(
			tileX,
			tileY,
			building.tile_cols,
			building.tile_rows
		);

		// 기존 건물들이 차지하는 모든 셀 수집
		const buildingStore = get(useBuilding().store).data;
		const worldBuildingStore = get(useWorld().worldBuildingStore).data;
		const existingCells: TileCell[] = [];

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
			existingCells.push(...cells);
		}

		return getOverlappingCells(placementCells, existingCells);
	}

	/**
	 * 현재 배치가 유효한지 (겹치는 셀이 없는지)
	 */
	get canPlace(): boolean {
		return this.getOverlappingCells().length === 0;
	}
}

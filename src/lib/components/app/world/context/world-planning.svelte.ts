import { get } from 'svelte/store';
import type { Building } from '$lib/types';
import {
	getBuildingOccupiedCells,
	getOverlappingCells,
	tileToCenterPixel,
	type TileCell,
} from '../tiles';
import { useBuilding } from '$lib/hooks/use-building';
import type { WorldContext } from './world-context.svelte';

export interface WorldPlanningPlacement {
	building: Building;
	x: number;
	y: number;
}

export class WorldPlanning {
	showGrid = $state(false);
	placement = $state<WorldPlanningPlacement | undefined>(undefined);

	private worldContext: WorldContext | undefined;

	setWorldContext(context: WorldContext) {
		this.worldContext = context;
	}

	/**
	 * 현재 배치하려는 건물과 기존 건물들의 겹치는 셀들 계산
	 */
	getOverlappingCells(): TileCell[] {
		if (!this.placement || !this.worldContext) return [];

		const { building, x, y } = this.placement;
		const placementCells = getBuildingOccupiedCells(x, y, building.tile_cols, building.tile_rows);

		// 기존 건물들이 차지하는 모든 셀 수집
		const buildingStore = get(useBuilding().store).data;
		const existingCells: TileCell[] = [];
		for (const worldBuilding of Object.values(this.worldContext.buildings)) {
			const buildingData = buildingStore[worldBuilding.building_id];
			if (!buildingData) continue;

			// tile_x, tile_y는 타일 인덱스이므로 픽셀 좌표로 변환
			const centerX = tileToCenterPixel(worldBuilding.tile_x);
			const centerY = tileToCenterPixel(worldBuilding.tile_y);
			const cells = getBuildingOccupiedCells(
				centerX,
				centerY,
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

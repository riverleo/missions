import type { BuildingId } from '$lib/types';

export interface WorldBlueprintCursor {
	buildingId: BuildingId;
	tileX: number;
	tileY: number;
}

export { WorldContext } from './world-context.svelte';
export { WorldContextBlueprint } from './world-context-blueprint.svelte';

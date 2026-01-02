import type { Building } from '$lib/types';

export interface WorldBlueprintCursor {
	building: Building;
	tileX: number;
	tileY: number;
}

export { WorldContext } from './world-context.svelte';
export { WorldBlueprint } from './world-blueprint.svelte';

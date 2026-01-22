import type { Vector, EntityTemplateId } from '$lib/types';
import type { Cell, TileCellKey } from '$lib/types/vector';
import type Matter from 'matter-js';

export interface BeforeUpdateEvent {
	timestamp: number;
	delta: number;
	source: Matter.Engine;
	name: string;
}

export interface WorldBlueprintCursor {
	entityTemplateId: EntityTemplateId;
	current: Vector;
	start?: Vector;
	type: 'tile' | 'cell';
	tileCellKeys: Set<TileCellKey>;
	overlappingCells: Cell[];
	tileBounds?: { minCol: number; maxCol: number; minRow: number; maxRow: number };
}

export { WorldContext } from './world-context.svelte';
export { WorldContextBlueprint } from './world-context-blueprint.svelte';

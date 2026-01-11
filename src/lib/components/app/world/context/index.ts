import type { EntityTemplateId } from '$lib/types';
import type Matter from 'matter-js';

export interface BeforeUpdateEvent {
	timestamp: number;
	delta: number;
	source: Matter.Engine;
	name: string;
}

export interface WorldBlueprintCursor {
	entityTemplateId: EntityTemplateId;
	x: number;
	y: number;
}

export { WorldContext } from './world-context.svelte';
export { WorldContextBlueprint, type GridType } from './world-context-blueprint.svelte';

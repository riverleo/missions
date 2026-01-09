import atlasesJson from '$lib/assets/atlas/generated/atlases.json';
import type { AtlasMetadata, MarkerOffset } from '$lib/types/atlas';
import type { TileWang2CornerIndex } from '$lib/types';

export { default as CharacterSpriteAnimator } from './character-sprite-animator.svelte';
export { default as BuildingSpriteAnimator } from './building-sprite-animator.svelte';
export { default as ItemSpriteAnimator } from './item-sprite-animator.svelte';
export { default as TileSpriteAnimator } from './tile-sprite-animator.svelte';
export { default as EntityTemplateSpriteAnimator } from './entity-template-sprite-animator.svelte';

export const DEFAULT_FPS = 24;
export const DEFAULT_FRAME_FROM = 1;

export interface SpriteAnimation {
	name: string;
	from?: number; // 1-based
	to?: number; // inclusive
	fps?: number;
}

// Re-export for convenience
export type FaceOffset = MarkerOffset;

export const atlases = atlasesJson as Record<string, AtlasMetadata>;

// Convert Wang Tile pattern index (1-16) to tileset frame index
// Tileset layout (0-based pattern values): [4,3,14,6][10,7,15,13][1,9,11,12][0,2,5,8]
// Frame index = columns * row + col
export function wangPatternToTilesetFrame(
	pattern: TileWang2CornerIndex,
	columns: number
): number {
	// Tileset layout: each value is a pattern index (0-based)
	const layout = [
		[4, 3, 14, 6], // row 0
		[10, 7, 15, 13], // row 1
		[1, 9, 11, 12], // row 2
		[0, 2, 5, 8], // row 3
	];

	// Convert 1-based pattern to 0-based value
	const value = pattern - 1;

	// Find position of value in layout
	for (let row = 0; row < layout.length; row++) {
		const rowData = layout[row];
		if (!rowData) continue;
		for (let col = 0; col < rowData.length; col++) {
			if (rowData[col] === value) {
				return columns * row + col;
			}
		}
	}

	throw new Error(`Invalid Wang pattern ${pattern}`);
}

import atlasesJson from '$lib/assets/atlas/generated/atlases.json';
import type { AtlasMetadata, MarkerOffset } from '$lib/types/atlas';

export { default as CharacterSpriteAnimator } from './character-sprite-animator.svelte';
export { default as BuildingSpriteAnimator } from './building-sprite-animator.svelte';
export { default as ItemSpriteAnimator } from './item-sprite-animator.svelte';

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

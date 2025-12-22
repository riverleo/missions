import atlasesJson from '$lib/assets/atlas/generated/atlases.json';

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

export interface FaceOffset {
	x: number;
	y: number;
}

export interface SpriteMetadata {
	frameWidth: number;
	frameHeight: number;
	columns: number;
	rows: number;
	frameCount: number;
	faceOffsets?: FaceOffset[]; // 프레임별 얼굴 위치 offset (마젠타 마커에서 추출)
	handOffsets?: FaceOffset[]; // 프레임별 손 위치 offset (초록 마커에서 추출)
}

export const atlases: Record<string, SpriteMetadata> = atlasesJson;

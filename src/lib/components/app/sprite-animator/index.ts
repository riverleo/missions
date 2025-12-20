import atlasesJson from '$lib/assets/atlas/generated/atlases.json';

export const DEFAULT_FPS = 24;
export const DEFAULT_FRAME_FROM = 1;

export interface SpriteAnimation {
	name: string;
	from?: number; // 1-based
	to?: number; // inclusive
	fps?: number;
}

export interface SpriteMetadata {
	frameWidth: number;
	frameHeight: number;
	columns: number;
	rows: number;
	frameCount: number;
}

export const atlases: Record<string, SpriteMetadata> = atlasesJson;

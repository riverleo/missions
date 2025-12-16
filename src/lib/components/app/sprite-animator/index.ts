import atlasesJson from '$lib/assets/atlas/generated/atlases.json';

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

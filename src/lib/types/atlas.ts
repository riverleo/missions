export interface MarkerOffset {
	x: number;
	y: number;
}

export interface AtlasMetadata {
	name: string;
	type: 'sprite' | 'tileset';
	frameWidth: number;
	frameHeight: number;
	columns: number;
	rows: number;
	frameCount: number;
	step: number; // 프레임 간 간격 (기본 1, tileset은 gridSize * gridSize)
	// Sprite only
	faceOffsets?: MarkerOffset[];
	handOffsets?: MarkerOffset[];
}

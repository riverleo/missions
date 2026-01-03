// 월드 크기 설정
export const WORLD_WIDTH = 800;
export const WORLD_HEIGHT = 400;

// 타일 설정
export const TILE_SIZE = 6;

// 경로 탐색 타일 설정
export const PATHFINDING_TILE_SIZE = 4;

// 틱 시스템 설정
export const TICK_INTERVAL = 1000; // 1 tick = 1초

// 물리 엔진 설정
export const WALL_THICKNESS = 1;

// 충돌 카테고리 (비트마스크)
export const CATEGORY_WALL = 0x0001;
export const CATEGORY_TERRAIN = 0x0002;
export const CATEGORY_CHARACTER = 0x0004;
export const CATEGORY_BUILDING = 0x0008;
export const CATEGORY_ITEM = 0x0010;

// 디버그 렌더링 스타일
export const DEBUG_TERRAIN_FILL_STYLE = 'rgba(255, 0, 0, 0.5)';
export const DEBUG_CHARACTER_FILL_STYLE = 'rgba(0, 255, 0, 0.5)';
export const DEBUG_BUILDING_FILL_STYLE = 'rgba(0, 0, 255, 0.5)';
export const DEBUG_ITEM_FILL_STYLE = 'rgba(255, 255, 0, 0.5)';

// 플래닝 타일 스타일
export const PLANNING_TILE_FILL_STYLE = 'rgba(34, 197, 94, 0.8)';

export const HIDDEN_BODY_STYLE = {
	visible: false,
};

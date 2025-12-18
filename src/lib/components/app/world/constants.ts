// 물리 엔진 설정
export const WALL_THICKNESS = 1;

// 충돌 카테고리 (비트마스크)
export const CATEGORY_WALL = 0x0001;
export const CATEGORY_TERRAIN = 0x0002;
export const CATEGORY_CHARACTER = 0x0004;
export const CATEGORY_BUILDING = 0x0008;

// 디버그 렌더링 스타일
export const DEBUG_TERRAIN_FILL_STYLE = 'rgba(255, 0, 0, 0.5)';
export const DEBUG_CHARACTER_FILL_STYLE = 'rgba(0, 255, 0, 0.5)';
export const DEBUG_BUILDING_FILL_STYLE = 'rgba(0, 0, 255, 0.5)';

export const HIDDEN_BODY_STYLE = {
	visible: false,
};

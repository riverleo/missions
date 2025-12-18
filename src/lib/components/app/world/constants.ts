// 스프라이트 해상도
export const CHARACTER_RESOLUTION = 2;
export const BUILDING_RESOLUTION = 2;

// 기본 크기 (아틀라스 없을 때)
export const DEFAULT_CHARACTER_SIZE = 32;
export const DEFAULT_BUILDING_SIZE = 64;

// 물리 엔진 설정
export const WALL_THICKNESS = 1;

// 충돌 카테고리 (비트마스크)
export const CATEGORY_WALL = 0x0001;
export const CATEGORY_TERRAIN = 0x0002;
export const CATEGORY_CHARACTER = 0x0004;
export const CATEGORY_BUILDING = 0x0008;

// 디버그 렌더링 스타일
export const DEBUG_BODY_STYLE = {
	fillStyle: 'rgba(255, 0, 0, 0.5)',
};

export const HIDDEN_BODY_STYLE = {
	visible: false,
};

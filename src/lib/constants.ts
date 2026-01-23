import type { WorldId, PlayerId, ScenarioId, UserId, ScenarioSnapshotId } from '$lib/types';

// 월드 크기 설정
export const WORLD_WIDTH = 800;
export const WORLD_HEIGHT = 400;

// 셀 및 타일 설정
export const CELL_SIZE = 8; // 배치/겹침 계산 최소 단위 (격자 한 칸)
export const TILE_SIZE = CELL_SIZE * 2; // 타일 렌더링 크기 (16px)
export const TILE_CELL_RATIO = TILE_SIZE / CELL_SIZE; // 타일이 차지하는 셀 수 (2x2)
export const MAX_TILE_PLACABLE_COUNT = 50; // 최대 타일 배치 가능 갯수

// 틱 시스템 설정
export const TICK_INTERVAL = 1000; // 1 tick = 1초

// 물리 엔진 설정
export const BOUNDARY_THICKNESS = 50;

// 충돌 카테고리 (비트마스크)
export const CATEGORY_BOUNDARY = 0x0001;
export const CATEGORY_TILE = 0x0002;
export const CATEGORY_CHARACTER = 0x0004;
export const CATEGORY_BUILDING = 0x0008;
export const CATEGORY_ITEM = 0x0010;

// 테스트 상수

export const TEST_USER_ID = 'test-user-id' as UserId;
export const TEST_WORLD_ID = 'test-world-id' as WorldId;
export const TEST_PLAYER_ID = 'test-player-id' as PlayerId;
export const TEST_SCENARIO_ID = 'test-scenario-id' as ScenarioId;
export const TEST_SCENARIO_SNAPSHOT_ID = 'test-scenario-snapshot-id' as ScenarioSnapshotId;

export const TEST_WORLD_STATE_STORAGE_KEY = 'test-world-state';

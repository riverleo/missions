-- character_interaction_actions 테이블에 대상 캐릭터 상태 및 트랜스폼 컬럼 추가

-- 대상 캐릭터 상태 컬럼 추가
alter table character_interaction_actions
  add column target_character_body_state_type character_body_state_type not null default 'idle',
  add column target_character_face_state_type character_face_state_type not null default 'idle';

-- 대상 캐릭터 트랜스폼 컬럼 추가
alter table character_interaction_actions
  add column target_character_offset_x integer not null default 0,
  add column target_character_offset_y integer not null default 0,
  add column target_character_scale float not null default 1.0,
  add column target_character_rotation float not null default 0;

-- 기존 캐릭터 오프셋/스케일/회전 컬럼 제거
alter table character_interaction_actions
  drop column if exists character_offset_x,
  drop column if exists character_offset_y,
  drop column if exists character_scale,
  drop column if exists character_rotation;

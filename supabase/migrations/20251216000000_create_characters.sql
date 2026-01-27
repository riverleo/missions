-- character_body_state_type enum
create type character_body_state_type as enum ('idle', 'walk', 'run', 'jump', 'pick');

-- character_face_state_type enum
create type character_face_state_type as enum ('idle', 'happy', 'sad', 'angry');

-- behavior_interact_type enum (행동 상호작용 종류)
create type behavior_interact_type as enum (
  'building_execute',   -- 건물 동작 실행
  'building_construct', -- 건물 건설
  'building_demolish',  -- 건물 철거
  'building_repair',    -- 건물 수리
  'building_clean',     -- 건물 청소
  'item_pick',          -- 아이템 줍기
  'item_use',           -- 아이템 사용
  'character_hug'       -- 캐릭터 허그
);

-- once/repeat 타입 분리
create type once_interaction_type as enum (
  'item_pick',
  'item_use',
  'building_execute',
  'building_construct',
  'building_demolish'
);

create type repeat_interaction_type as enum (
  'building_execute',
  'building_repair',
  'building_clean',
  'character_hug'
);

-- loop_mode enum
create type loop_mode as enum ('loop', 'once', 'ping-pong', 'ping-pong-once');

-- collider_type enum
create type collider_type as enum ('circle', 'rectangle');

-- character_bodies 테이블 (공유 가능한 몸통)
create table character_bodies (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  name text not null default '',
  collider_type collider_type not null default 'circle',
  collider_width real not null default 0,
  collider_height real not null default 0,
  collider_offset_x real not null default 0,
  collider_offset_y real not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint uq_character_bodies_scenario_id_name unique (scenario_id, name)
);

alter table character_bodies enable row level security;

create policy "admins can view character_bodies"
  on character_bodies
  for select
  to authenticated
  using (is_admin());

create policy "admins can insert character_bodies"
  on character_bodies
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update character_bodies"
  on character_bodies
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete character_bodies"
  on character_bodies
  for delete
  to authenticated
  using (is_admin());

-- character_body_states 테이블
create table character_body_states (
  id uuid primary key default gen_random_uuid(),
  body_id uuid not null references character_bodies(id) on delete cascade,
  type character_body_state_type not null default 'idle',
  atlas_name text not null,
  frame_from integer,
  frame_to integer,
  fps integer,
  loop loop_mode not null default 'loop',
  -- 얼굴 렌더링 설정
  character_face_state character_face_state_type,  -- 이 body state일 때 강제할 face state (null이면 현재 감정 따라감)
  in_front boolean not null default false,         -- true면 몸이 앞, 얼굴이 뒤에 렌더링

  constraint uq_character_body_states_body_id_type unique (body_id, type)
);

alter table character_body_states enable row level security;

create policy "admins can view character_body_states"
  on character_body_states
  for select
  to authenticated
  using (is_admin());

create policy "admins can insert character_body_states"
  on character_body_states
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update character_body_states"
  on character_body_states
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete character_body_states"
  on character_body_states
  for delete
  to authenticated
  using (is_admin());

-- characters 테이블
create table characters (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  character_body_id uuid not null references character_bodies(id) on delete restrict,
  name text not null default '',
  scale real not null default 1.0,
  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint uq_characters_scenario_id_name unique (scenario_id, name)
);

alter table characters enable row level security;

create policy "admins can view characters"
  on characters
  for select
  to authenticated
  using (is_admin());

create policy "admins can insert characters"
  on characters
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update characters"
  on characters
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete characters"
  on characters
  for delete
  to authenticated
  using (is_admin());

-- character_face_states 테이블
create table character_face_states (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters(id) on delete cascade,
  type character_face_state_type not null default 'idle',
  atlas_name text not null,
  frame_from integer,
  frame_to integer,
  fps integer,
  loop loop_mode not null default 'loop',
  -- 얼굴 위치 offset (캐릭터별, 표정별로 세밀하게 조정)
  offset_x real not null default 0,
  offset_y real not null default 0,

  constraint uq_character_face_states_character_id_type unique (character_id, type)
);

alter table character_face_states enable row level security;

create policy "admins can view character_face_states"
  on character_face_states
  for select
  to authenticated
  using (is_admin());

create policy "admins can insert character_face_states"
  on character_face_states
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update character_face_states"
  on character_face_states
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete character_face_states"
  on character_face_states
  for delete
  to authenticated
  using (is_admin());

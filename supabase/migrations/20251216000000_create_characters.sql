-- characters 테이블
create table characters (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  name text not null default '',
  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint uq_characters_scenario_id_name unique (scenario_id, name)
);

alter table characters enable row level security;

-- 모든 사람이 캐릭터를 조회할 수 있음
create policy "anyone can view characters"
  on characters
  for select
  to public
  using (true);

-- 어드민만 캐릭터를 추가할 수 있음
create policy "admins can insert characters"
  on characters
  for insert
  to authenticated
  with check (is_admin());

-- 어드민만 캐릭터를 수정할 수 있음
create policy "admins can update characters"
  on characters
  for update
  to authenticated
  using (is_admin());

-- 어드민만 캐릭터를 삭제할 수 있음
create policy "admins can delete characters"
  on characters
  for delete
  to authenticated
  using (is_admin());

-- character_state_type enum
create type character_state_type as enum ('idle', 'walk', 'jump');

-- loop_mode enum
create type loop_mode as enum ('loop', 'once', 'ping-pong', 'ping-pong-once');

-- character_states 테이블
create table character_states (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters(id) on delete cascade,
  type character_state_type not null,
  atlas_name text not null,
  frame_from integer,
  frame_to integer,
  fps integer,
  loop loop_mode not null default 'loop',

  constraint uq_character_states_character_id_type unique (character_id, type)
);

alter table character_states enable row level security;

-- 모든 사람이 캐릭터 상태를 조회할 수 있음
create policy "anyone can view character_states"
  on character_states
  for select
  to public
  using (true);

-- 어드민만 캐릭터 상태를 추가할 수 있음
create policy "admins can insert character_states"
  on character_states
  for insert
  to authenticated
  with check (is_admin());

-- 어드민만 캐릭터 상태를 수정할 수 있음
create policy "admins can update character_states"
  on character_states
  for update
  to authenticated
  using (is_admin());

-- 어드민만 캐릭터 상태를 삭제할 수 있음
create policy "admins can delete character_states"
  on character_states
  for delete
  to authenticated
  using (is_admin());

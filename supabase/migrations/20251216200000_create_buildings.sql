-- buildings 테이블
create table buildings (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  name text not null default '',
  cell_cols integer not null default 0,
  cell_rows integer not null default 0,
  item_max_capacity integer not null default 0,
  scale real not null default 1.0,
  collider_offset_x real not null default 0,
  collider_offset_y real not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint uq_buildings_scenario_id_name unique (scenario_id, name)
);

alter table buildings enable row level security;

-- 어드민만 건물을 조회할 수 있음
create policy "admins can view buildings"
  on buildings
  for select
  to authenticated
  using (is_admin());

-- 어드민만 건물을 추가할 수 있음
create policy "admins can insert buildings"
  on buildings
  for insert
  to authenticated
  with check (is_admin());

-- 어드민만 건물을 수정할 수 있음
create policy "admins can update buildings"
  on buildings
  for update
  to authenticated
  using (is_admin());

-- 어드민만 건물을 삭제할 수 있음
create policy "admins can delete buildings"
  on buildings
  for delete
  to authenticated
  using (is_admin());

-- building_state_type enum
create type building_state_type as enum ('idle', 'damaged', 'planning', 'constructing');

-- building_states 테이블
create table building_states (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  type building_state_type not null default 'idle',
  atlas_name text not null,
  frame_from integer,
  frame_to integer,
  fps integer,
  loop loop_mode not null default 'loop',

  constraint uq_building_states_building_id_type unique (building_id, type)
);

alter table building_states enable row level security;

-- 어드민만 건물 상태를 조회할 수 있음
create policy "admins can view building_states"
  on building_states
  for select
  to authenticated
  using (is_admin());

-- 어드민만 건물 상태를 추가할 수 있음
create policy "admins can insert building_states"
  on building_states
  for insert
  to authenticated
  with check (is_admin());

-- 어드민만 건물 상태를 수정할 수 있음
create policy "admins can update building_states"
  on building_states
  for update
  to authenticated
  using (is_admin());

-- 어드민만 건물 상태를 삭제할 수 있음
create policy "admins can delete building_states"
  on building_states
  for delete
  to authenticated
  using (is_admin());

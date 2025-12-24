-- building_behavior_type enum (건물 행동 종류)
create type building_behavior_type as enum (
  'demolish',  -- 철거
  'use',       -- 사용
  'repair',    -- 수리
  'refill'     -- 보충
);

-- building_behaviors 테이블
create table building_behaviors (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  type building_behavior_type not null,
  description text not null default '',

  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint uq_building_behaviors_building_id_type unique (building_id, type)
);

alter table building_behaviors enable row level security;

create policy "anyone can view building_behaviors"
  on building_behaviors
  for select
  to public
  using (true);

create policy "admins can insert building_behaviors"
  on building_behaviors
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update building_behaviors"
  on building_behaviors
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete building_behaviors"
  on building_behaviors
  for delete
  to authenticated
  using (is_admin());

-- building_behavior_actions 테이블
create table building_behavior_actions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  behavior_id uuid not null references building_behaviors(id) on delete cascade,
  root boolean not null default false,

  -- 캐릭터 상태
  character_body_state_type character_body_state_type not null default 'idle',
  character_face_state_type character_face_state_type not null default 'idle',

  -- 건물 바닥 중앙 기준 캐릭터 위치 오프셋
  offset_x integer not null default 0,
  offset_y integer not null default 0,

  -- 지속 시간 (틱 단위)
  duration_ticks float not null default 0,

  -- 다음 액션
  success_building_behavior_action_id uuid references building_behavior_actions(id) on delete set null,
  failure_building_behavior_action_id uuid references building_behavior_actions(id) on delete set null
);

alter table building_behavior_actions enable row level security;

create policy "anyone can view building_behavior_actions"
  on building_behavior_actions
  for select
  to public
  using (true);

create policy "admins can insert building_behavior_actions"
  on building_behavior_actions
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update building_behavior_actions"
  on building_behavior_actions
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete building_behavior_actions"
  on building_behavior_actions
  for delete
  to authenticated
  using (is_admin());

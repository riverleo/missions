-- condition_behaviors 테이블 (언제/왜 행동이 발동되는지)
create table condition_behaviors (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  condition_id uuid not null references conditions(id) on delete cascade,
  condition_threshold float not null default 0,
  character_id uuid references characters(id) on delete set null,
  character_behavior_type character_behavior_type not null default 'use',

  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint uq_condition_behaviors_building_condition_behavior_character unique nulls not distinct (building_id, condition_id, character_behavior_type, character_id)
);

alter table condition_behaviors enable row level security;

create policy "anyone can view condition_behaviors"
  on condition_behaviors
  for select
  to public
  using (true);

create policy "admins can insert condition_behaviors"
  on condition_behaviors
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update condition_behaviors"
  on condition_behaviors
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete condition_behaviors"
  on condition_behaviors
  for delete
  to authenticated
  using (is_admin());

-- condition_behavior_actions 테이블 (행동의 세부 액션: 캐릭터 애니메이션)
create table condition_behavior_actions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  condition_id uuid not null references conditions(id) on delete cascade,
  condition_behavior_id uuid not null references condition_behaviors(id) on delete cascade,
  type behavior_action_type not null default 'idle'::behavior_action_type,
  root boolean not null default false,

  -- 캐릭터 상태
  character_body_state_type character_body_state_type not null default 'idle',
  character_face_state_type character_face_state_type not null default 'idle',

  -- 캐릭터 오프셋 (건물 바닥 중앙 기준)
  character_offset_x integer not null default 0,
  character_offset_y integer not null default 0,

  -- 캐릭터 스케일
  character_scale float not null default 1.0,

  -- 캐릭터 회전 (도)
  character_rotation float not null default 0,

  -- 지속 시간 (틱 단위)
  duration_ticks float not null default 0,

  -- 다음 액션
  next_condition_behavior_action_id uuid references condition_behavior_actions(id) on delete set null
);

alter table condition_behavior_actions enable row level security;

create policy "anyone can view condition_behavior_actions"
  on condition_behavior_actions
  for select
  to public
  using (true);

create policy "admins can insert condition_behavior_actions"
  on condition_behavior_actions
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update condition_behavior_actions"
  on condition_behavior_actions
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete condition_behavior_actions"
  on condition_behavior_actions
  for delete
  to authenticated
  using (is_admin());

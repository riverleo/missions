-- condition_behaviors 테이블 (언제/왜 행동이 발동되는지)
create table condition_behaviors (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  condition_id uuid not null references conditions(id) on delete cascade,
  condition_threshold float not null default 0,
  character_id uuid references characters(id) on delete set null,
  name text not null,

  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint uq_condition_behaviors_scenario_id_name unique (scenario_id, name)
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

-- condition_behavior_actions 테이블 (행동의 세부 액션)
create table condition_behavior_actions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  condition_id uuid not null references conditions(id) on delete cascade,
  condition_behavior_id uuid not null references condition_behaviors(id) on delete cascade,
  type behavior_action_type not null default 'idle'::behavior_action_type,
  character_behavior_type character_behavior_type, -- nullable: interact 타입에만 사용
  root boolean not null default false,

  -- 캐릭터 얼굴 표정
  character_face_state_type character_face_state_type not null default 'idle',

  -- 지속 시간 (틱 단위, idle 타입에서만 사용)
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

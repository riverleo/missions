-- behavior_action_type enum (액션의 종류)
create type behavior_action_type as enum (
  'go',         -- 건물/아이템/캐릭터로 이동
  'interact',   -- 건물/아이템/캐릭터와 상호작용
  'idle'        -- 대기
);

-- need_behaviors 테이블 (언제/왜 행동이 발동되는지)
create table need_behaviors (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  need_id uuid not null references needs(id) on delete cascade,
  need_threshold float not null default 0,
  character_id uuid references characters(id) on delete set null, -- nullable: null이면 모든 캐릭터
  name text not null,

  -- 캐릭터 얼굴 표정
  character_face_state_type character_face_state_type not null default 'idle',

  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint uq_need_behaviors_scenario_id_name unique (scenario_id, name)
);

alter table need_behaviors enable row level security;

create policy "anyone can view need_behaviors"
  on need_behaviors
  for select
  to public
  using (true);

create policy "admins can insert need_behaviors"
  on need_behaviors
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update need_behaviors"
  on need_behaviors
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete need_behaviors"
  on need_behaviors
  for delete
  to authenticated
  using (is_admin());

-- need_behavior_actions 테이블 (행동의 세부 액션)
create table need_behavior_actions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  need_id uuid not null references needs(id) on delete cascade,
  behavior_id uuid not null references need_behaviors(id) on delete cascade,
  type behavior_action_type not null default 'idle'::behavior_action_type,
  character_behavior_type character_behavior_type, -- nullable: interact 타입에만 사용
  root boolean not null default false,

  -- go/interact 타입용: 대상 지정
  building_id uuid references buildings(id) on delete set null,
  character_id uuid references characters(id) on delete set null,
  item_id uuid references items(id) on delete set null,

  -- 지속 시간 (틱 단위, idle 타입에서만 사용)
  duration_ticks float not null default 0,

  -- 다음 액션
  next_need_behavior_action_id uuid references need_behavior_actions(id) on delete set null
);

alter table need_behavior_actions enable row level security;

create policy "anyone can view need_behavior_actions"
  on need_behavior_actions
  for select
  to public
  using (true);

create policy "admins can insert need_behavior_actions"
  on need_behavior_actions
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update need_behavior_actions"
  on need_behavior_actions
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete need_behavior_actions"
  on need_behavior_actions
  for delete
  to authenticated
  using (is_admin());

-- 행동 상태를 character_state_type에 추가
alter type character_state_type add value 'eating';
alter type character_state_type add value 'sleeping';
alter type character_state_type add value 'angry';
alter type character_state_type add value 'sad';
alter type character_state_type add value 'happy';

-- need_behavior_action_type enum (액션의 종류)
create type need_behavior_action_type as enum (
  'go_to',      -- 특정 건물로 이동
  'wait',       -- 대기
  'state'       -- 캐릭터 상태 변경
);

-- need_behaviors 테이블 (언제/왜 행동이 발동되는지)
create table need_behaviors (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  need_id uuid not null references needs(id) on delete cascade,
  need_threshold float not null default 0,
  name text not null,

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
  order_in_need_behavior integer not null default 0,
  type need_behavior_action_type not null default 'wait'::need_behavior_action_type,

  -- go_to 타입용
  building_id uuid references buildings(id) on delete set null,

  -- state 타입용
  character_state_type character_state_type,

  -- 지속 시간 (초 단위)
  duration_per_second float not null default 0,

  -- 노드 구조: 성공/실패 시 다음 액션
  success_need_behavior_action_id uuid references need_behavior_actions(id) on delete set null,
  failure_need_behavior_action_id uuid references need_behavior_actions(id) on delete set null
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

-- need_behaviors에 first_action_id 추가 (순환 참조 해결을 위해 alter table 사용)
alter table need_behaviors
  add column first_action_id uuid references need_behavior_actions(id) on delete set null;

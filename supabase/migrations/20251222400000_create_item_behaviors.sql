-- item_behavior_type enum (아이템 행동 종류)
create type item_behavior_type as enum (
  'pickup',  -- 집기
  'using',   -- 사용
  'drop'     -- 놓기
);

-- item_behaviors 테이블
create table item_behaviors (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  type item_behavior_type not null,
  description text not null default '',

  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint uq_item_behaviors_item_id_type unique (item_id, type)
);

alter table item_behaviors enable row level security;

create policy "anyone can view item_behaviors"
  on item_behaviors
  for select
  to public
  using (true);

create policy "admins can insert item_behaviors"
  on item_behaviors
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update item_behaviors"
  on item_behaviors
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete item_behaviors"
  on item_behaviors
  for delete
  to authenticated
  using (is_admin());

-- item_behavior_actions 테이블
create table item_behavior_actions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  behavior_id uuid not null references item_behaviors(id) on delete cascade,
  root boolean not null default false,

  -- 아이템 상태
  item_state_type item_state_type not null default 'idle',

  -- 캐릭터 상태
  character_body_state_type character_body_state_type not null default 'idle',
  character_face_state_type character_face_state_type not null default 'neutral',

  -- 지속 시간 (틱 단위)
  duration_ticks float not null default 0,

  -- 다음 액션
  success_item_behavior_action_id uuid references item_behavior_actions(id) on delete set null,
  failure_item_behavior_action_id uuid references item_behavior_actions(id) on delete set null
);

alter table item_behavior_actions enable row level security;

create policy "anyone can view item_behavior_actions"
  on item_behavior_actions
  for select
  to public
  using (true);

create policy "admins can insert item_behavior_actions"
  on item_behavior_actions
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update item_behavior_actions"
  on item_behavior_actions
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete item_behavior_actions"
  on item_behavior_actions
  for delete
  to authenticated
  using (is_admin());

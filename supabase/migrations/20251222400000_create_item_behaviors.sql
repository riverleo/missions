-- item_behaviors 테이블 (아이템 행동: 사용, 청소 등)
create table item_behaviors (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  durability_threshold bigint, -- nullable: null이면 임계점 무관 (use), 값 있으면 임계점 적용 (clean)
  character_id uuid references characters(id) on delete set null, -- nullable: null이면 모든 캐릭터
  character_behavior_type character_behavior_type not null default 'use',

  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint uq_item_behaviors_item_behavior_character unique nulls not distinct (item_id, character_behavior_type, character_id)
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

  -- 캐릭터 상태
  character_body_state_type character_body_state_type not null default 'idle',
  character_face_state_type character_face_state_type not null default 'idle',

  -- 아이템 오프셋 (캐릭터 중심 기준)
  item_offset_x integer not null default 0,
  item_offset_y integer not null default 0,

  -- 아이템 스케일
  item_scale float not null default 1.0,

  -- 아이템 회전 (도)
  item_rotation float not null default 0,

  -- 지속 시간 (틱 단위)
  duration_ticks float not null default 0,

  -- 다음 액션
  next_item_behavior_action_id uuid references item_behavior_actions(id) on delete set null
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

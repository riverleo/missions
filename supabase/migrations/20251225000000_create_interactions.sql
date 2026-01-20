-- building_interactions 테이블 (건물과의 상호작용: 캐릭터 애니메이션)
create table building_interactions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  character_behavior_type character_behavior_type not null default 'use',
  character_id uuid references characters(id) on delete set null, -- nullable: null이면 모든 캐릭터
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

  -- 지속 시간 (틱 단위, 0이면 애니메이션 끝까지)
  duration_ticks float not null default 0,

  -- 다음 상호작용
  next_building_interaction_id uuid references building_interactions(id) on delete set null,

  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint uq_building_interactions_building_behavior_character unique nulls not distinct (building_id, character_behavior_type, character_id)
);

alter table building_interactions enable row level security;

create policy "anyone can view building_interactions"
  on building_interactions
  for select
  to public
  using (true);

create policy "admins can insert building_interactions"
  on building_interactions
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update building_interactions"
  on building_interactions
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete building_interactions"
  on building_interactions
  for delete
  to authenticated
  using (is_admin());

-- item_interactions 테이블 (아이템과의 상호작용: 아이템 애니메이션)
create table item_interactions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  character_behavior_type character_behavior_type not null default 'use',
  character_id uuid references characters(id) on delete set null, -- nullable: null이면 모든 캐릭터
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

  -- 지속 시간 (틱 단위, 0이면 애니메이션 끝까지)
  duration_ticks float not null default 0,

  -- 다음 상호작용
  next_item_interaction_id uuid references item_interactions(id) on delete set null,

  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint uq_item_interactions_item_behavior_character unique nulls not distinct (item_id, character_behavior_type, character_id)
);

alter table item_interactions enable row level security;

create policy "anyone can view item_interactions"
  on item_interactions
  for select
  to public
  using (true);

create policy "admins can insert item_interactions"
  on item_interactions
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update item_interactions"
  on item_interactions
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete item_interactions"
  on item_interactions
  for delete
  to authenticated
  using (is_admin());

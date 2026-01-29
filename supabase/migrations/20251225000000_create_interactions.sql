-- ============================================
-- Building Interactions
-- ============================================

-- building_interactions 테이블 (건물 상호작용 정의)
create table building_interactions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  building_id uuid references buildings(id) on delete cascade, -- nullable: null이면 기본 인터렉션 (모든 건물 공통)
  once_interaction_type once_interaction_type,
  repeat_interaction_type repeat_interaction_type,
  character_id uuid references characters(id) on delete set null, -- nullable: null이면 모든 캐릭터

  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint chk_building_interaction_type_exclusive check ((once_interaction_type is not null)::int + (repeat_interaction_type is not null)::int = 1),
  constraint uq_building_interactions_building_id_interaction_type_character_id unique nulls not distinct (building_id, once_interaction_type, repeat_interaction_type, character_id)
);

alter table building_interactions enable row level security;

create policy "admins can view building_interactions"
  on building_interactions
  for select
  to authenticated
  using (is_admin());

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

-- building_interaction_actions 테이블 (상호작용 애니메이션 액션)
create table building_interaction_actions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  building_id uuid references buildings(id) on delete cascade, -- nullable: null이면 기본 인터랙션의 액션
  building_interaction_id uuid not null references building_interactions(id) on delete cascade,
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
  duration_ticks float not null default 6,

  -- 다음 액션
  next_building_interaction_action_id uuid references building_interaction_actions(id) on delete set null,

  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null
);

alter table building_interaction_actions enable row level security;

create policy "admins can view building_interaction_actions"
  on building_interaction_actions
  for select
  to authenticated
  using (is_admin());

create policy "admins can insert building_interaction_actions"
  on building_interaction_actions
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update building_interaction_actions"
  on building_interaction_actions
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete building_interaction_actions"
  on building_interaction_actions
  for delete
  to authenticated
  using (is_admin());

-- ============================================
-- Item Interactions
-- ============================================

-- item_interactions 테이블 (아이템 상호작용 정의)
create table item_interactions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  item_id uuid references items(id) on delete cascade, -- nullable: null이면 기본 인터렉션 (모든 아이템 공통)
  once_interaction_type once_interaction_type,
  repeat_interaction_type repeat_interaction_type,
  character_id uuid references characters(id) on delete set null, -- nullable: null이면 모든 캐릭터

  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint chk_item_interaction_type_exclusive check ((once_interaction_type is not null)::int + (repeat_interaction_type is not null)::int = 1),
  constraint uq_item_interactions_item_id_interaction_type_character_id unique nulls not distinct (item_id, once_interaction_type, repeat_interaction_type, character_id)
);

alter table item_interactions enable row level security;

create policy "admins can view item_interactions"
  on item_interactions
  for select
  to authenticated
  using (is_admin());

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

-- item_interaction_actions 테이블 (상호작용 애니메이션 액션)
create table item_interaction_actions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  item_id uuid references items(id) on delete cascade, -- nullable: null이면 기본 인터랙션의 액션
  item_interaction_id uuid not null references item_interactions(id) on delete cascade,
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
  duration_ticks float not null default 6,

  -- 다음 액션
  next_item_interaction_action_id uuid references item_interaction_actions(id) on delete set null,

  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null
);

alter table item_interaction_actions enable row level security;

create policy "admins can view item_interaction_actions"
  on item_interaction_actions
  for select
  to authenticated
  using (is_admin());

create policy "admins can insert item_interaction_actions"
  on item_interaction_actions
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update item_interaction_actions"
  on item_interaction_actions
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete item_interaction_actions"
  on item_interaction_actions
  for delete
  to authenticated
  using (is_admin());

-- ============================================
-- Character Interactions
-- ============================================

-- character_interactions 테이블 (캐릭터 간 상호작용 정의)
create table character_interactions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  character_id uuid references characters(id) on delete set null, -- nullable: null이면 모든 캐릭터
  target_character_id uuid references characters(id) on delete cascade, -- nullable: null이면 기본 인터렉션 (모든 캐릭터 대상)
  once_interaction_type once_interaction_type,
  repeat_interaction_type repeat_interaction_type,

  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint chk_character_interaction_type_exclusive check ((once_interaction_type is not null)::int + (repeat_interaction_type is not null)::int = 1),
  constraint uq_character_interactions_character_id_target_character_id_interaction_type unique nulls not distinct (character_id, target_character_id, once_interaction_type, repeat_interaction_type)
);

alter table character_interactions enable row level security;

create policy "admins can view character_interactions"
  on character_interactions
  for select
  to authenticated
  using (is_admin());

create policy "admins can insert character_interactions"
  on character_interactions
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update character_interactions"
  on character_interactions
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete character_interactions"
  on character_interactions
  for delete
  to authenticated
  using (is_admin());

-- character_interaction_actions 테이블 (상호작용 애니메이션 액션)
create table character_interaction_actions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  character_id uuid references characters(id) on delete cascade, -- nullable: null이면 기본 인터랙션의 액션
  target_character_id uuid references characters(id) on delete cascade, -- nullable: null이면 기본 인터랙션의 액션
  character_interaction_id uuid not null references character_interactions(id) on delete cascade,
  root boolean not null default false,

  -- 캐릭터 상태 (현재 캐릭터)
  character_body_state_type character_body_state_type not null default 'idle',
  character_face_state_type character_face_state_type not null default 'idle',

  -- 캐릭터 상태 (대상 캐릭터)
  target_character_body_state_type character_body_state_type not null default 'idle',
  target_character_face_state_type character_face_state_type not null default 'idle',

  -- 캐릭터 오프셋 (상호작용 캐릭터 중심 기준)
  target_character_offset_x integer not null default 0,
  target_character_offset_y integer not null default 0,

  -- 캐릭터 스케일
  target_character_scale float not null default 1.0,

  -- 캐릭터 회전 (도)
  target_character_rotation float not null default 0,

  -- 지속 시간 (틱 단위)
  duration_ticks float not null default 6,

  -- 다음 액션
  next_character_interaction_action_id uuid references character_interaction_actions(id) on delete set null,

  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null
);

alter table character_interaction_actions enable row level security;

create policy "admins can view character_interaction_actions"
  on character_interaction_actions
  for select
  to authenticated
  using (is_admin());

create policy "admins can insert character_interaction_actions"
  on character_interaction_actions
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update character_interaction_actions"
  on character_interaction_actions
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete character_interaction_actions"
  on character_interaction_actions
  for delete
  to authenticated
  using (is_admin());

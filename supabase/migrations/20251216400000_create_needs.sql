-- 욕구 충족 소스 타입
create type need_fulfillment_type as enum (
  'building',  -- 건물 방문
  'task',      -- 할일 완료
  'item',      -- 아이템 소비
  'idle'       -- 가만히 있으면 회복
);

-- needs 테이블 (욕구 정의)
create table needs (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  name text not null,

  max_value float not null default 100,
  initial_value float not null default 50,
  decrease_per_tick float not null default 0,

  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint uq_needs_scenario_id_name unique (scenario_id, name)
);

alter table needs enable row level security;

create policy "anyone can view needs"
  on needs
  for select
  to public
  using (true);

create policy "admins can insert needs"
  on needs
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update needs"
  on needs
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete needs"
  on needs
  for delete
  to authenticated
  using (is_admin());

-- need_fulfillments 테이블 (욕구 충족 방법)
create table need_fulfillments (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  need_id uuid not null references needs(id) on delete cascade,

  fulfillment_type need_fulfillment_type not null,
  building_id uuid references buildings(id) on delete cascade,
  increase_per_tick float not null default 0,

  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null
);

alter table need_fulfillments enable row level security;

create policy "anyone can view need_fulfillments"
  on need_fulfillments
  for select
  to public
  using (true);

create policy "admins can insert need_fulfillments"
  on need_fulfillments
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update need_fulfillments"
  on need_fulfillments
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete need_fulfillments"
  on need_fulfillments
  for delete
  to authenticated
  using (is_admin());

-- character_needs 테이블 (캐릭터 타입별 욕구 스켈레톤)
create table character_needs (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  need_id uuid not null references needs(id) on delete cascade,

  decay_multiplier float not null default 1.0,

  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint uq_character_needs unique (character_id, need_id)
);

alter table character_needs enable row level security;

create policy "anyone can view character_needs"
  on character_needs
  for select
  to public
  using (true);

create policy "admins can insert character_needs"
  on character_needs
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update character_needs"
  on character_needs
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete character_needs"
  on character_needs
  for delete
  to authenticated
  using (is_admin());

-- world_character_needs 테이블 (월드 캐릭터의 실제 욕구 값)
create table world_character_needs (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  world_id uuid not null references worlds(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  world_character_id uuid not null references world_characters(id) on delete cascade,
  need_id uuid not null references needs(id) on delete cascade,

  value float not null,

  constraint uq_world_character_needs unique (world_character_id, need_id)
);

alter table world_character_needs enable row level security;

create policy "anyone can view world_character_needs"
  on world_character_needs
  for select
  to public
  using (true);

create policy "owner or admin can insert world_character_needs"
  on world_character_needs
  for insert
  to authenticated
  with check (is_world_owner(world_id) or is_admin());

create policy "owner or admin can update world_character_needs"
  on world_character_needs
  for update
  to authenticated
  using (is_world_owner(world_id) or is_admin());

create policy "owner or admin can delete world_character_needs"
  on world_character_needs
  for delete
  to authenticated
  using (is_world_owner(world_id) or is_admin());

-- 컨디션 충족 소스 타입
create type condition_fulfillment_type as enum (
  'building'    -- 건물 상호작용 (repair, clean 등)
);

-- 컨디션 정의 (내구도, 청결도 등)
create table conditions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  name text not null default '',
  decrease_per_tick float not null default 0,
  max_value float not null default 100,
  initial_value float not null default 100,
  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint uq_conditions_scenario_id_name unique (scenario_id, name)
);

alter table conditions enable row level security;

-- 모든 사람이 조회 가능
create policy "admins can view conditions"
  on conditions
  for select
  to authenticated
  using (is_admin());

-- admin만 CUD 가능
create policy "admin can insert conditions"
  on conditions
  for insert
  to public
  with check (is_admin());

create policy "admin can update conditions"
  on conditions
  for update
  to public
  using (is_admin());

create policy "admin can delete conditions"
  on conditions
  for delete
  to public
  using (is_admin());

-- condition_fulfillments 테이블 (컨디션 충족/회복 방법)
create table condition_fulfillments (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  condition_id uuid not null references conditions(id) on delete cascade,

  fulfillment_type condition_fulfillment_type not null,

  increase_per_tick float not null default 0,

  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null
);

alter table condition_fulfillments enable row level security;

create policy "admins can view condition_fulfillments"
  on condition_fulfillments
  for select
  to authenticated
  using (is_admin());

create policy "admins can insert condition_fulfillments"
  on condition_fulfillments
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update condition_fulfillments"
  on condition_fulfillments
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete condition_fulfillments"
  on condition_fulfillments
  for delete
  to authenticated
  using (is_admin());

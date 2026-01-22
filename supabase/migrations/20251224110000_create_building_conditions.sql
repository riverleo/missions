-- 건물 타입별 컨디션 (어떤 건물이 어떤 컨디션을 가지는지)
create table building_conditions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  condition_id uuid not null references conditions(id) on delete cascade,
  decrease_multiplier float not null default 1.0,
  disabled_when_depleted boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint uq_building_conditions_building_id_condition_id unique (building_id, condition_id)
);

alter table building_conditions enable row level security;

-- 모든 사람이 조회 가능
create policy "admins can view building_conditions"
  on building_conditions
  for select
  to authenticated
  using (is_admin());

-- admin만 CUD 가능
create policy "admin can insert building_conditions"
  on building_conditions
  for insert
  to public
  with check (is_admin());

create policy "admin can update building_conditions"
  on building_conditions
  for update
  to public
  using (is_admin());

create policy "admin can delete building_conditions"
  on building_conditions
  for delete
  to public
  using (is_admin());

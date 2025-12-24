-- 건물 컨디션 효과 테이블 (컨디션에 따른 욕구 변화)
create table building_condition_effects (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  name text not null,
  building_id uuid not null references buildings(id) on delete cascade,
  condition_id uuid not null references conditions(id) on delete cascade,
  building_condition_id uuid not null references building_conditions(id) on delete cascade,
  character_id uuid references characters(id) on delete set null,
  need_id uuid not null references needs(id) on delete cascade,
  min_threshold float not null default 0,
  max_threshold float not null default 100,
  change_per_tick float not null default 0,

  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint uq_building_condition_effects_scenario_id_name unique (scenario_id, name)
);

alter table building_condition_effects enable row level security;

-- 모든 사람이 조회 가능
create policy "anyone can view building_condition_effects"
  on building_condition_effects
  for select
  to public
  using (true);

-- admin만 CUD 가능
create policy "admin can insert building_condition_effects"
  on building_condition_effects
  for insert
  to public
  with check (is_admin());

create policy "admin can update building_condition_effects"
  on building_condition_effects
  for update
  to public
  using (is_admin());

create policy "admin can delete building_condition_effects"
  on building_condition_effects
  for delete
  to public
  using (is_admin());

-- 월드 건물의 런타임 컨디션 값
create table world_building_conditions (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  world_id uuid not null references worlds(id) on delete cascade,
  world_building_id uuid not null references world_buildings(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  building_condition_id uuid not null references building_conditions(id) on delete cascade,
  condition_id uuid not null references conditions(id) on delete cascade,
  value float not null default 100,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,

  constraint uq_world_building_conditions_world_building_id_condition_id unique (world_building_id, condition_id)
);

alter table world_building_conditions enable row level security;

-- 월드 소유자만 조회/수정 가능 (soft delete된 것 제외)
create policy "world owner can view world_building_conditions"
  on world_building_conditions
  for select
  to public
  using (is_world_owner(world_id) and deleted_at is null);

create policy "world owner can insert world_building_conditions"
  on world_building_conditions
  for insert
  to public
  with check (is_world_owner(world_id));

create policy "world owner can update world_building_conditions"
  on world_building_conditions
  for update
  to public
  using (
    is_world_owner(world_id)
    and (deleted_at is null or is_admin())
  );

create policy "admin can delete world_building_conditions"
  on world_building_conditions
  for delete
  to public
  using (is_admin());

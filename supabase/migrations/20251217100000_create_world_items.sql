-- world_items 테이블 (월드에 배치된 아이템 인스턴스)
create table world_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  scenario_id uuid not null references scenarios(id) on delete cascade,
  world_id uuid not null references worlds(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  world_building_id uuid references world_buildings(id) on delete set null,
  state item_state_type not null default 'idle'::item_state_type,
  durability_ticks bigint, -- nullable: max_durability_ticks가 null인 아이템은 이것도 null
  x float not null default 0,
  y float not null default 0,
  rotation float not null default 0,
  created_at_tick bigint not null default 0,
  created_at timestamptz not null default now()
);

alter table world_items enable row level security;

create policy "anyone can view world_items"
  on world_items
  for select
  to public
  using (true);

create policy "owner or admin can insert world_items"
  on world_items
  for insert
  to authenticated
  with check (is_world_owner(world_id) or is_admin());

create policy "owner or admin can update world_items"
  on world_items
  for update
  to authenticated
  using (is_world_owner(world_id) or is_admin());

create policy "owner or admin can delete world_items"
  on world_items
  for delete
  to authenticated
  using (is_world_owner(world_id) or is_admin());

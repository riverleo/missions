-- items 테이블
create table items (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  name text not null default '',
  max_durability_ticks bigint, -- nullable: 내구도가 없는 아이템도 있음
  scale real not null default 1.0,
  collider_type collider_type not null default 'rectangle',
  collider_width real not null default 32.0,
  collider_height real not null default 32.0,
  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint uq_items_scenario_id_name unique (scenario_id, name)
);

alter table items enable row level security;

create policy "anyone can view items"
  on items
  for select
  to public
  using (true);

create policy "admins can insert items"
  on items
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update items"
  on items
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete items"
  on items
  for delete
  to authenticated
  using (is_admin());

-- item_state_type enum
create type item_state_type as enum ('idle', 'broken');

-- item_states 테이블
create table item_states (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  type item_state_type not null,
  atlas_name text not null,
  frame_from integer,
  frame_to integer,
  fps integer,
  loop loop_mode not null default 'loop',

  constraint uq_item_states_item_id_type unique (item_id, type)
);

alter table item_states enable row level security;

create policy "anyone can view item_states"
  on item_states
  for select
  to public
  using (true);

create policy "admins can insert item_states"
  on item_states
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update item_states"
  on item_states
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete item_states"
  on item_states
  for delete
  to authenticated
  using (is_admin());

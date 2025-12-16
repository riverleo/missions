create type publish_status as enum ('draft', 'published');

create table scenarios (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  display_order integer not null default 0,
  status publish_status not null default 'draft',
  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null
);

create type player_scenario_status as enum ('in_progress', 'completed');

create table player_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  scenario_id uuid not null references scenarios(id) on delete cascade,
  status player_scenario_status not null default 'in_progress',
  created_at timestamptz not null default now(),

  constraint uq_player_scenarios_player_id_scenario_id_status unique (player_id, scenario_id, status)
);

alter table scenarios enable row level security;
alter table player_scenarios enable row level security;

create policy "authenticated can view published scenarios"
  on scenarios
  for select
  to authenticated
  using (status = 'published' or is_admin());

create policy "admins can insert scenarios"
  on scenarios
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update scenarios"
  on scenarios
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete scenarios"
  on scenarios
  for delete
  to authenticated
  using (is_admin());

create policy "players can view their own player_scenarios"
  on player_scenarios
  for select
  to authenticated
  using (is_own_player(user_id, player_id));

create policy "players can insert their own player_scenarios"
  on player_scenarios
  for insert
  to authenticated
  with check (is_own_player(user_id, player_id));

insert into scenarios (title, status) values ('도람푸의 역습', 'draft');

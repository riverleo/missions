create type scenario_quest_type as enum ('primary', 'secondary');
create type player_scenario_quest_status as enum ('in_progress', 'completed', 'abandoned');

create table scenario_quests (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  title text not null default '',
  type scenario_quest_type not null default 'secondary',
  status publish_status not null default 'draft',
  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null
);

create table scenario_quest_branches (
  id uuid primary key default gen_random_uuid(),
  scenario_quest_id uuid not null references scenario_quests(id) on delete cascade,
  parent_scenario_quest_branch_id uuid references scenario_quest_branches(id) on delete set null,
  title text not null default '',
  display_order_in_scenario_quest integer not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null
);

create table player_scenario_quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  scenario_id uuid not null references scenarios(id) on delete cascade,
  scenario_quest_id uuid not null references scenario_quests(id) on delete cascade,
  status player_scenario_quest_status not null default 'in_progress',
  created_at timestamptz not null default now(),

  constraint uq_player_scenario_quests_player_id_scenario_quest_id_status unique (player_id, scenario_quest_id, status)
);

create table player_scenario_quest_branches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  scenario_id uuid not null references scenarios(id) on delete cascade,
  player_scenario_quest_id uuid not null references player_scenario_quests(id) on delete cascade,
  scenario_quest_id uuid not null references scenario_quests(id) on delete cascade,
  scenario_quest_branch_id uuid not null references scenario_quest_branches(id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint uq_player_scenario_quest_branches_player_id_scenario_quest_id_scenario_quest_branch_id unique (player_id, scenario_quest_id, scenario_quest_branch_id)
);

alter table scenario_quests enable row level security;
alter table scenario_quest_branches enable row level security;
alter table player_scenario_quests enable row level security;
alter table player_scenario_quest_branches enable row level security;

create policy "authenticated can view published scenario_quests"
  on scenario_quests
  for select
  to authenticated
  using (status = 'published' or is_admin());

create policy "admins can insert scenario_quests"
  on scenario_quests
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update scenario_quests"
  on scenario_quests
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete scenario_quests"
  on scenario_quests
  for delete
  to authenticated
  using (is_admin());

create policy "authenticated can view scenario_quest_branches"
  on scenario_quest_branches
  for select
  to authenticated
  using (true);

create policy "admins can insert scenario_quest_branches"
  on scenario_quest_branches
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update scenario_quest_branches"
  on scenario_quest_branches
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete scenario_quest_branches"
  on scenario_quest_branches
  for delete
  to authenticated
  using (is_admin());

create policy "players can view their own player_scenario_quests"
  on player_scenario_quests
  for select
  to authenticated
  using (is_own_player(user_id, player_id));

create policy "players can insert their own player_scenario_quests"
  on player_scenario_quests
  for insert
  to authenticated
  with check (is_own_player(user_id, player_id));

create policy "players can view their own player_scenario_quest_branches"
  on player_scenario_quest_branches
  for select
  to authenticated
  using (is_own_player(user_id, player_id));

create policy "players can insert their own player_scenario_quest_branches"
  on player_scenario_quest_branches
  for insert
  to authenticated
  with check (is_own_player(user_id, player_id));

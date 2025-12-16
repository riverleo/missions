create type quest_type as enum ('primary', 'secondary');
create type player_quest_status as enum ('in_progress', 'completed', 'abandoned');

create table quests (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  title text not null default '',
  type quest_type not null default 'secondary',
  status publish_status not null default 'draft',
  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null
);

create table quest_branches (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references quests(id) on delete cascade,
  parent_quest_branch_id uuid references quest_branches(id) on delete set null,
  title text not null default '',
  display_order_in_quest integer not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null
);

create table player_quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  scenario_id uuid not null references scenarios(id) on delete cascade,
  quest_id uuid not null references quests(id) on delete cascade,
  status player_quest_status not null default 'in_progress',
  created_at timestamptz not null default now(),

  constraint uq_player_quests_player_id_quest_id_status unique (player_id, quest_id, status)
);

create table player_quest_branches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  scenario_id uuid not null references scenarios(id) on delete cascade,
  player_quest_id uuid not null references player_quests(id) on delete cascade,
  quest_id uuid not null references quests(id) on delete cascade,
  quest_branch_id uuid not null references quest_branches(id) on delete cascade,
  created_at timestamptz not null default now(),

  constraint uq_player_quest_branches_player_id_quest_id_quest_branch_id unique (player_id, quest_id, quest_branch_id)
);

alter table quests enable row level security;
alter table quest_branches enable row level security;
alter table player_quests enable row level security;
alter table player_quest_branches enable row level security;

create policy "authenticated can view published quests"
  on quests
  for select
  to authenticated
  using (status = 'published' or is_admin());

create policy "admins can insert quests"
  on quests
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update quests"
  on quests
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete quests"
  on quests
  for delete
  to authenticated
  using (is_admin());

create policy "authenticated can view quest_branches"
  on quest_branches
  for select
  to authenticated
  using (true);

create policy "admins can insert quest_branches"
  on quest_branches
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update quest_branches"
  on quest_branches
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete quest_branches"
  on quest_branches
  for delete
  to authenticated
  using (is_admin());

create policy "players can view their own player_quests"
  on player_quests
  for select
  to authenticated
  using (is_own_player(user_id, player_id));

create policy "players can insert their own player_quests"
  on player_quests
  for insert
  to authenticated
  with check (is_own_player(user_id, player_id));

create policy "players can view their own player_quest_branches"
  on player_quest_branches
  for select
  to authenticated
  using (is_own_player(user_id, player_id));

create policy "players can insert their own player_quest_branches"
  on player_quest_branches
  for insert
  to authenticated
  with check (is_own_player(user_id, player_id));

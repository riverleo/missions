create table scenario_chapters (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  title text not null default '',
  "order" integer not null,
  status publish_status not null default 'draft',
  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint uq_scenario_chapters_scenario_id_order unique (scenario_id, "order")
);

create type player_scenario_chapter_status as enum ('in_progress', 'completed');

create table player_scenario_chapters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  scenario_id uuid not null references scenarios(id) on delete cascade,
  scenario_chapter_id uuid not null references scenario_chapters(id) on delete set null,
  status player_scenario_chapter_status not null default 'in_progress',
  created_at timestamptz not null default now(),

  constraint uq_player_scenario_chapters_player_id_scenario_chapter_id_status unique (player_id, scenario_chapter_id, status)
);

alter table scenario_quests add column scenario_chapter_id uuid references scenario_chapters(id) on delete set null;
alter table scenario_quests add column order_in_chapter integer not null default 0;

alter table scenario_chapters enable row level security;
alter table player_scenario_chapters enable row level security;

create policy "authenticated can view published scenario_chapters"
  on scenario_chapters
  for select
  to authenticated
  using (status = 'published' or is_admin());

create policy "admins can insert scenario_chapters"
  on scenario_chapters
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update scenario_chapters"
  on scenario_chapters
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete scenario_chapters"
  on scenario_chapters
  for delete
  to authenticated
  using (is_admin());

create policy "players can view their own player_scenario_chapters"
  on player_scenario_chapters
  for select
  to authenticated
  using (is_own_player(user_id, player_id));

create policy "players can insert their own player_scenario_chapters"
  on player_scenario_chapters
  for insert
  to authenticated
  with check (is_own_player(user_id, player_id));

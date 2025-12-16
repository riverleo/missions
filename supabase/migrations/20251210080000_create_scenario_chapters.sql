create table chapters (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  parent_chapter_id uuid references chapters(id) on delete set null,
  title text not null default '',
  display_order_in_scenario integer not null default 0,
  status publish_status not null default 'draft',
  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null
);

create type player_chapter_status as enum ('in_progress', 'completed');

create table player_chapters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  scenario_id uuid not null references scenarios(id) on delete cascade,
  chapter_id uuid not null references chapters(id) on delete set null,
  status player_chapter_status not null default 'in_progress',
  created_at timestamptz not null default now(),

  constraint uq_player_chapters_player_id_chapter_id_status unique (player_id, chapter_id, status)
);

alter table quests add column chapter_id uuid references chapters(id) on delete set null;
alter table quests add column order_in_chapter integer not null default 0;

alter table chapters enable row level security;
alter table player_chapters enable row level security;

create policy "authenticated can view published chapters"
  on chapters
  for select
  to authenticated
  using (status = 'published' or is_admin());

create policy "admins can insert chapters"
  on chapters
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update chapters"
  on chapters
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete chapters"
  on chapters
  for delete
  to authenticated
  using (is_admin());

create policy "players can view their own player_chapters"
  on player_chapters
  for select
  to authenticated
  using (is_own_player(user_id, player_id));

create policy "players can insert their own player_chapters"
  on player_chapters
  for insert
  to authenticated
  with check (is_own_player(user_id, player_id));

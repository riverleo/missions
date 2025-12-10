create type dice_roll_action as enum ('narrative_node', 'narrative_node_done', 'chapter_done');

create table dice_roll (
  id uuid primary key default gen_random_uuid(),
  difficulty_class integer not null,
  success_action dice_roll_action not null,
  success_narrative_node_id uuid references narrative_nodes(id) on delete cascade,
  failure_action dice_roll_action not null,
  failure_narrative_node_id uuid references narrative_nodes(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table dice_roll enable row level security;

create policy "authenticated can view dice_roll"
  on dice_roll
  for select
  to authenticated
  using (true);

create policy "admins can insert dice_roll"
  on dice_roll
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update dice_roll"
  on dice_roll
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete dice_roll"
  on dice_roll
  for delete
  to authenticated
  using (is_admin());

create table player_dice_rolled (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  player_quest_id uuid references player_quests(id) on delete cascade,
  player_quest_branch_id uuid references player_quest_branches(id) on delete cascade,
  narrative_id uuid not null references narratives(id) on delete cascade,
  narrative_node_id uuid not null references narrative_nodes(id) on delete cascade,
  narrative_node_choice_id uuid references narrative_node_choices(id) on delete cascade,
  quest_id uuid references quests(id) on delete cascade,
  quest_branch_id uuid references quest_branches(id) on delete cascade,
  dice_id uuid references dice(id) on delete cascade,
  dice_roll_id uuid not null references dice_roll(id) on delete cascade,
  value integer,
  created_at timestamptz not null default now()
);

create or replace function create_player_dice_rolled_value()
returns trigger as $$
declare
  dice_faces integer;
  default_dice_id uuid;
begin
  if NEW.dice_id is null then
    select id into default_dice_id from dice where is_default = true limit 1;
    NEW.dice_id := default_dice_id;
  end if;

  if NEW.value is null then
    select faces into dice_faces from dice where id = NEW.dice_id;
    NEW.value := floor(random() * dice_faces) + 1;
  end if;

  return NEW;
end;
$$ language plpgsql;

create trigger insert_player_dice_rolled_value
  before insert on player_dice_rolled
  for each row
  execute function create_player_dice_rolled_value();

alter table player_dice_rolled enable row level security;

create policy "players can view their own player_dice_rolled"
  on player_dice_rolled
  for select
  to authenticated
  using (is_own_player(user_id, player_id));

create policy "players can insert their own player_dice_rolled"
  on player_dice_rolled
  for insert
  to authenticated
  with check (is_own_player(user_id, player_id));

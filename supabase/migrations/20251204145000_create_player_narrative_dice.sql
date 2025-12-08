create table player_narrative_dice (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  narrative_id uuid not null references narratives(id) on delete cascade,
  narrative_node_id uuid not null,
  quest_id uuid references quests(id) on delete cascade,
  quest_branch_id uuid references quest_branches(id) on delete cascade,
  player_quest_id uuid references player_quests(id) on delete cascade,
  player_quest_branch_id uuid references player_quest_branches(id) on delete cascade,
  dice_id uuid references dice(id) on delete cascade,
  value integer,
  created_at timestamptz not null default now()
);

create or replace function create_player_narrative_dice_value()
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

create trigger insert_player_narrative_dice_value
  before insert on player_narrative_dice
  for each row
  execute function create_player_narrative_dice_value();

alter table player_narrative_dice enable row level security;

create policy "players can view their own player_narrative_dice"
  on player_narrative_dice
  for select
  to authenticated
  using (is_own_player(user_id, player_id));

create policy "players can insert their own player_narrative_dice"
  on player_narrative_dice
  for insert
  to authenticated
  with check (is_own_player(user_id, player_id));

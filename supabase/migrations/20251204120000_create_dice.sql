create type dice_roll_action_type as enum ('narrative_node', 'terminate');

create type dice_roll_action as (
  type dice_roll_action_type,
  narrative_node_id uuid
);

create type dice_roll as (
  difficulty_class integer,
  success dice_roll_action,
  failure dice_roll_action
);

create table dice (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  faces integer not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

insert into dice (title, faces, is_default) values ('D20', 20, true);

alter table dice enable row level security;

create policy "authenticated can view dice"
  on dice
  for select
  to authenticated
  using (true);

create policy "admins can insert dice"
  on dice
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update dice"
  on dice
  for update
  to authenticated
  using (is_admin());

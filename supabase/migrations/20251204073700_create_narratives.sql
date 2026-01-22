create type narrative_node_type as enum ('text', 'choice');

create table narratives (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint uq_narratives_title unique (title)
);

create table narrative_nodes (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  narrative_id uuid not null references narratives(id) on delete cascade,
  title text not null default '',
  description text not null default '',
  root boolean not null default false,
  type narrative_node_type not null,
  created_at timestamptz not null default now(),
  created_user_id uuid references auth.users(id) on delete set null
);

create table narrative_node_choices (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  narrative_node_id uuid not null references narrative_nodes(id) on delete cascade,
  title text not null default '',
  description text not null default '',
  order_in_narrative_node integer not null default 0,
  created_at timestamptz not null default now(),
  created_user_id uuid references auth.users(id) on delete set null
);

alter table narratives enable row level security;
alter table narrative_nodes enable row level security;
alter table narrative_node_choices enable row level security;

create policy "admins can view narratives"
  on narratives
  for select
  to authenticated
  using (is_admin());

create policy "admins can insert narratives"
  on narratives
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update narratives"
  on narratives
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete narratives"
  on narratives
  for delete
  to authenticated
  using (is_admin());

create policy "admins can view narrative_nodes"
  on narrative_nodes
  for select
  to authenticated
  using (is_admin());

create policy "admins can insert narrative_nodes"
  on narrative_nodes
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update narrative_nodes"
  on narrative_nodes
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete narrative_nodes"
  on narrative_nodes
  for delete
  to authenticated
  using (is_admin());

create policy "admins can view narrative_node_choices"
  on narrative_node_choices
  for select
  to authenticated
  using (is_admin());

create policy "admins can insert narrative_node_choices"
  on narrative_node_choices
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update narrative_node_choices"
  on narrative_node_choices
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete narrative_node_choices"
  on narrative_node_choices
  for delete
  to authenticated
  using (is_admin());

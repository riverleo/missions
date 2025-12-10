create table dices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  faces integer not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),

  constraint uq_dices_name unique (name)
);

insert into dices (name, faces, is_default) values ('d20', 20, true);

alter table dices enable row level security;

create policy "authenticated can view dices"
  on dices
  for select
  to authenticated
  using (true);

create policy "admins can insert dices"
  on dices
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update dices"
  on dices
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete dices"
  on dices
  for delete
  to authenticated
  using (is_admin());

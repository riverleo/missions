-- characters 테이블
create table characters (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  name text not null default '',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null
);

create index idx_characters_scenario_id on characters(scenario_id);

alter table characters enable row level security;

-- 모든 사람이 캐릭터를 조회할 수 있음
create policy "anyone can view characters"
  on characters
  for select
  to public
  using (true);

-- 어드민만 캐릭터를 추가할 수 있음
create policy "admins can insert characters"
  on characters
  for insert
  to authenticated
  with check (is_admin());

-- 어드민만 캐릭터를 수정할 수 있음
create policy "admins can update characters"
  on characters
  for update
  to authenticated
  using (is_admin());

-- 어드민만 캐릭터를 삭제할 수 있음
create policy "admins can delete characters"
  on characters
  for delete
  to authenticated
  using (is_admin());

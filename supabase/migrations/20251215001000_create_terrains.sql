-- terrains 테이블
create table terrains (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  title text not null default '',
  game_asset text,
  width real not null default 0,
  height real not null default 0,
  start_x real,
  start_y real,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null
);

create index idx_terrains_scenario_id on terrains(scenario_id);

alter table terrains enable row level security;

-- 모든 사람이 지형을 조회할 수 있음
create policy "anyone can view terrains"
  on terrains
  for select
  to public
  using (true);

-- 어드민만 지형을 추가할 수 있음
create policy "admins can insert terrains"
  on terrains
  for insert
  to authenticated
  with check (is_admin());

-- 어드민만 지형을 수정할 수 있음
create policy "admins can update terrains"
  on terrains
  for update
  to authenticated
  using (is_admin());

-- 어드민만 지형을 삭제할 수 있음
create policy "admins can delete terrains"
  on terrains
  for delete
  to authenticated
  using (is_admin());

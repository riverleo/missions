-- scenario_snapshots 테이블 (시나리오의 특정 시점 데이터 스냅샷)
create table scenario_snapshots (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  name text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null
);

alter table scenario_snapshots enable row level security;

create policy "anyone can view scenario_snapshots"
  on scenario_snapshots
  for select
  to public
  using (true);

create policy "admins can insert scenario_snapshots"
  on scenario_snapshots
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update scenario_snapshots"
  on scenario_snapshots
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete scenario_snapshots"
  on scenario_snapshots
  for delete
  to authenticated
  using (is_admin());

-- worlds 테이블에 snapshot_id 추가
alter table worlds add column snapshot_id uuid references scenario_snapshots(id) on delete set null;

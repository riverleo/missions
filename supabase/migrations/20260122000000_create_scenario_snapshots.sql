-- scenario_snapshots 테이블 (시나리오의 특정 시점 데이터 스냅샷)
create table scenario_snapshots (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  name text not null,
  description text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,
  constraint uq_scenario_snapshots_name unique (name)
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

-- player_scenarios 테이블에 scenario_snapshot_id 추가
alter table player_scenarios add column scenario_snapshot_id uuid not null references scenario_snapshots(id) on delete cascade;

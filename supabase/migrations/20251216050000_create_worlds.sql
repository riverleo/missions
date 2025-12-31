-- worlds 테이블 (플레이어가 소유한 월드)
create table worlds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  scenario_id uuid not null references scenarios(id) on delete cascade,
  terrain_id uuid references terrains(id) on delete set null,
  name text not null,
  created_at timestamptz not null default now()
);

alter table worlds enable row level security;

-- 모든 사람이 월드를 조회할 수 있음
create policy "anyone can view worlds"
  on worlds
  for select
  to public
  using (true);

-- 자기 자신 또는 어드민만 월드를 추가할 수 있음
create policy "owner or admin can insert worlds"
  on worlds
  for insert
  to authenticated
  with check (is_me(user_id) or is_admin());

-- 자기 자신 또는 어드민만 월드를 수정할 수 있음
create policy "owner or admin can update worlds"
  on worlds
  for update
  to authenticated
  using (is_me(user_id) or is_admin());

-- 자기 자신 또는 어드민만 월드를 삭제할 수 있음
create policy "owner or admin can delete worlds"
  on worlds
  for delete
  to authenticated
  using (is_me(user_id) or is_admin());

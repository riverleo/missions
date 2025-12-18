-- world_buildings 테이블 (월드에 배치된 건물 인스턴스)
create table world_buildings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  world_id uuid not null references worlds(id) on delete cascade,
  building_id uuid not null references buildings(id) on delete cascade,
  x real not null default 0,
  y real not null default 0,
  created_at timestamptz not null default now()
);

alter table world_buildings enable row level security;

-- 모든 사람이 월드 건물을 조회할 수 있음
create policy "anyone can view world_buildings"
  on world_buildings
  for select
  to public
  using (true);

-- 월드 소유자 또는 어드민만 월드 건물을 추가할 수 있음
create policy "owner or admin can insert world_buildings"
  on world_buildings
  for insert
  to authenticated
  with check (is_world_owner(world_id) or is_admin());

-- 월드 소유자 또는 어드민만 월드 건물을 수정할 수 있음
create policy "owner or admin can update world_buildings"
  on world_buildings
  for update
  to authenticated
  using (is_world_owner(world_id) or is_admin());

-- 월드 소유자 또는 어드민만 월드 건물을 삭제할 수 있음
create policy "owner or admin can delete world_buildings"
  on world_buildings
  for delete
  to authenticated
  using (is_world_owner(world_id) or is_admin());

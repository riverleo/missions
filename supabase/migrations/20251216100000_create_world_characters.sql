-- world_characters 테이블 (월드에 배치된 캐릭터 인스턴스)
create table world_characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  scenario_id uuid not null references scenarios(id) on delete cascade,
  world_id uuid not null references worlds(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  x real not null default 0,
  y real not null default 0,
  created_at_tick bigint not null default 0,
  created_at timestamptz not null default now()
);

alter table world_characters enable row level security;

-- 월드 소유자 확인 함수
create or replace function is_world_owner(wid uuid)
returns boolean as $$
  select exists (
    select 1 from public.worlds where id = wid and user_id = auth.uid()
  );
$$ language sql security definer
set search_path = '';

-- 모든 사람이 월드 캐릭터를 조회할 수 있음
create policy "anyone can view world_characters"
  on world_characters
  for select
  to public
  using (true);

-- 월드 소유자 또는 어드민만 월드 캐릭터를 추가할 수 있음
create policy "owner or admin can insert world_characters"
  on world_characters
  for insert
  to authenticated
  with check (is_world_owner(world_id) or is_admin());

-- 월드 소유자 또는 어드민만 월드 캐릭터를 수정할 수 있음
create policy "owner or admin can update world_characters"
  on world_characters
  for update
  to authenticated
  using (is_world_owner(world_id) or is_admin());

-- 월드 소유자 또는 어드민만 월드 캐릭터를 삭제할 수 있음
create policy "owner or admin can delete world_characters"
  on world_characters
  for delete
  to authenticated
  using (is_world_owner(world_id) or is_admin());

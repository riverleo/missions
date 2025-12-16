-- player_characters 테이블 (월드에 배치된 캐릭터 인스턴스)
create table player_characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  character_id uuid not null references characters(id) on delete cascade,
  x real not null default 0,
  y real not null default 0,
  created_at timestamptz not null default now()
);

alter table player_characters enable row level security;

-- 모든 사람이 플레이어 캐릭터를 조회할 수 있음
create policy "anyone can view player_characters"
  on player_characters
  for select
  to public
  using (true);

-- 자기 자신 또는 어드민만 플레이어 캐릭터를 추가할 수 있음
create policy "owner or admin can insert player_characters"
  on player_characters
  for insert
  to authenticated
  with check (is_me(user_id) or is_admin());

-- 자기 자신 또는 어드민만 플레이어 캐릭터를 수정할 수 있음
create policy "owner or admin can update player_characters"
  on player_characters
  for update
  to authenticated
  using (is_me(user_id) or is_admin());

-- 자기 자신 또는 어드민만 플레이어 캐릭터를 삭제할 수 있음
create policy "owner or admin can delete player_characters"
  on player_characters
  for delete
  to authenticated
  using (is_me(user_id) or is_admin());

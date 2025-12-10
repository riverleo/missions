-- player 테이블
create table players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  bio text,                                       -- 자기소개
  avatar text,                                    -- 프로필 이미지 파일명

  -- 스탯
  health integer not null default 100,        -- 건강
  stress integer not null default 0,          -- 스트레스
  strength integer not null default 0,        -- 근력
  stamina integer not null default 0,         -- 지구력
  intelligence integer not null default 0,    -- 지능
  charm integer not null default 0,           -- 매력
  refinement integer not null default 0,      -- 교양
  appearance integer not null default 0,      -- 외모

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 삭제되지 않은 레코드 중에서 user_id는 유일해야 함 (한 유저당 하나의 플레이어)
create unique index uq_players_user_id
  on players(user_id)
  where deleted_at is null;

-- updated_at 트리거
create trigger players_trig_update_updated_at
  before update on players
  for each row
  execute function update_updated_at();

-- RLS 활성화
alter table players enable row level security;

-- 유저는 자신의 플레이어를 조회할 수 있고, 관리자는 모든 플레이어를 조회할 수 있음
create policy "authenticated can view players"
  on players
  for select
  to authenticated
  using (
    deleted_at is null
    and (is_me(user_id) or is_admin())
  );

-- 유저는 자신의 플레이어를 생성할 수 있음
create policy "users can create their own player"
  on players
  for insert
  to authenticated
  with check (is_me(user_id));

-- 유저는 자신의 플레이어를 수정할 수 있고, 관리자는 모든 플레이어를 수정할 수 있음
create policy "authenticated can update players"
  on players
  for update
  to authenticated
  using (is_me(user_id) or is_admin());

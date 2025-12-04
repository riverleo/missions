-- player_quest_branch_completion_status enum
create type player_quest_branch_completion_status as enum ('available', 'in_progress', 'completed');

-- quest_branch_narrative_triggers 테이블 (quest_branch와 narrative_bundle 매핑)
create table quest_branch_narrative_triggers (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references quests(id) on delete cascade,
  quest_branch_id uuid not null references quest_branches(id) on delete cascade,
  narrative_bundle_id uuid not null references narrative_bundles(id) on delete cascade,
  priority integer not null default 0,

  -- 트리거 조건 관련 필드는 추후 추가 예정

  created_at timestamptz not null default now()
);

-- player_quest_branch_narratives 테이블 (플레이어가 경험한 narrative 기록)
create table player_quest_branch_narratives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id uuid not null references quests(id) on delete cascade,
  quest_branch_id uuid not null references quest_branches(id) on delete cascade,
  quest_branch_narrative_trigger_id uuid not null references quest_branch_narrative_triggers(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  narrative_id uuid not null references narratives(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- RLS 활성화
alter table quest_branch_narrative_triggers enable row level security;
alter table player_quest_branch_narratives enable row level security;

-- quest_branch_narrative_triggers: 모든 인증된 유저가 조회 가능, 관리자만 수정 가능
create policy "authenticated can view quest_branch_narrative_triggers"
  on quest_branch_narrative_triggers
  for select
  to authenticated
  using (true);

create policy "admins can insert quest_branch_narrative_triggers"
  on quest_branch_narrative_triggers
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update quest_branch_narrative_triggers"
  on quest_branch_narrative_triggers
  for update
  to authenticated
  using (is_admin());

-- player_quest_branch_narratives: 자신의 narrative 기록만 조회/생성 가능
create policy "users can view their own player_quest_branch_narratives"
  on player_quest_branch_narratives
  for select
  to authenticated
  using (is_me(user_id));

create policy "users can insert their own player_quest_branch_narratives"
  on player_quest_branch_narratives
  for insert
  to authenticated
  with check (is_me(user_id) and is_my_player(player_id));

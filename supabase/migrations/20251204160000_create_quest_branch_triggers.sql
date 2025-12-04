create table quest_branch_triggers (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references quests(id) on delete cascade,
  quest_branch_id uuid not null references quest_branches(id) on delete cascade,
  narrative_bundle_id uuid not null references narrative_bundles(id) on delete cascade,
  priority integer not null default 0,

  -- 트리거 조건 관련 필드는 추후 추가 예정

  created_at timestamptz not null default now()
);

alter table player_quest_branches
  add column current_narrative_id uuid references narratives(id) on delete cascade,
  add column current_quest_branch_trigger_id uuid references quest_branch_triggers(id) on delete cascade;

-- RLS 활성화
alter table quest_branch_triggers enable row level security;

-- quest_branch_triggers: 모든 인증된 유저가 조회 가능, 관리자만 수정 가능
create policy "authenticated can view quest_branch_triggers"
  on quest_branch_triggers
  for select
  to authenticated
  using (true);

create policy "admins can insert quest_branch_triggers"
  on quest_branch_triggers
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update quest_branch_triggers"
  on quest_branch_triggers
  for update
  to authenticated
  using (is_admin());

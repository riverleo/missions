create type quest_trigger_type as enum ('todo_complete');
create type quest_type as enum ('primary', 'secondary');
create type quest_status as enum ('draft', 'published');
create type player_quest_status as enum ('available', 'in_progress', 'completed');

create table quests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type quest_type not null default 'secondary',
  status quest_status not null default 'draft',
  priority integer not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table quest_triggers (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references quests(id) on delete cascade,
  type quest_trigger_type not null,
  created_at timestamptz not null default now()
);

create table quest_branches (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references quests(id) on delete cascade,
  parent_quest_branch_id uuid references quest_branches(id) on delete cascade,
  title text not null default '',
  is_leaf boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table player_quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id uuid not null references quests(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  status player_quest_status not null default 'available',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  in_progressed_at timestamptz,

  -- player_id + quest_id는 유일해야 함
  constraint player_quests_uniq_player_quest unique (player_id, quest_id)
);

create table player_quest_branches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id uuid not null references quests(id) on delete cascade,
  quest_branch_id uuid not null references quest_branches(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  player_quest_id uuid not null references player_quests(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- player_quest status 변경 시 audit 시각 자동 기록 함수
create or replace function update_player_quest_status_timestamps()
returns trigger as $$
begin
  -- status가 'in_progress'로 변경되면 in_progressed_at 기록
  if new.status = 'in_progress' and (old.status is null or old.status != 'in_progress') then
    new.in_progressed_at = now();
  end if;

  -- status가 'completed'로 변경되면 completed_at 기록
  if new.status = 'completed' and (old.status is null or old.status != 'completed') then
    new.completed_at = now();
  end if;

  return new;
end;
$$ language plpgsql
set search_path = '';

-- player_quests 테이블에 트리거 설정
create trigger player_quests_trig_update_status_timestamps
  before insert or update of status on player_quests
  for each row
  execute function update_player_quest_status_timestamps();

-- RLS 활성화
alter table quests enable row level security;
alter table quest_triggers enable row level security;
alter table quest_branches enable row level security;
alter table player_quests enable row level security;
alter table player_quest_branches enable row level security;

-- quests: 인증된 유저는 published된 퀘스트만 조회 가능, 관리자는 모두 조회 가능
create policy "authenticated can view published quests"
  on quests
  for select
  to authenticated
  using (
    deleted_at is null
    and (status = 'published' or is_admin())
  );

create policy "admins can insert quests"
  on quests
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update quests"
  on quests
  for update
  to authenticated
  using (is_admin());

-- quest_triggers: 모든 인증된 유저가 조회 가능, 관리자만 수정 가능
create policy "authenticated can view quest_triggers"
  on quest_triggers
  for select
  to authenticated
  using (true);

create policy "admins can insert quest_triggers"
  on quest_triggers
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update quest_triggers"
  on quest_triggers
  for update
  to authenticated
  using (is_admin());

-- quest_branches: 모든 인증된 유저가 조회 가능, 관리자만 수정 가능
create policy "authenticated can view quest_branches"
  on quest_branches
  for select
  to authenticated
  using (true);

create policy "admins can insert quest_branches"
  on quest_branches
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update quest_branches"
  on quest_branches
  for update
  to authenticated
  using (is_admin());

-- player_quests: 자신의 퀘스트 상태만 조회/생성 가능
create policy "users can view their own player_quests"
  on player_quests
  for select
  to authenticated
  using (is_me(user_id));

create policy "users can insert their own player_quests"
  on player_quests
  for insert
  to authenticated
  with check (is_me(user_id) and is_my_player(player_id));

create policy "users can update their own player_quests"
  on player_quests
  for update
  to authenticated
  using (is_me(user_id));

-- player_quest_branches: 자신의 퀘스트 분기 히스토리만 조회/생성 가능
create policy "users can view their own player_quest_branches"
  on player_quest_branches
  for select
  to authenticated
  using (is_me(user_id));

create policy "users can insert their own player_quest_branches"
  on player_quest_branches
  for insert
  to authenticated
  with check (is_me(user_id) and is_my_player(player_id));

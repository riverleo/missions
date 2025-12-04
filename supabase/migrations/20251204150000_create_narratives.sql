create type narrative_type as enum ('text', 'choice');
create type dice_roll_action_type as enum ('narrative', 'terminate');

create type dice_roll_action as (
  type dice_roll_action_type,
  narrative_id uuid
);

create type dice_roll as (
  difficulty_class integer,
  silent boolean,
  success dice_roll_action,
  failure dice_roll_action
);

create type narrative_choice as (
  id text,
  text text,
  dice_roll dice_roll
);

create table narratives (
  id uuid primary key default gen_random_uuid(),
  type narrative_type not null default 'text',
  title text not null default '',
  description text default '',

  dice_roll dice_roll default ROW(0, true, ROW('terminate'::dice_roll_action_type, null::uuid), ROW('terminate'::dice_roll_action_type, null::uuid))::dice_roll,
  choices narrative_choice[] default '{}',

  created_at timestamptz not null default now()
);

-- narrative_bundles 테이블
create table narrative_bundles (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  root_narrative_id uuid not null references narratives(id) on delete cascade,
  narrative_ids uuid[] not null default '{}',
  data narratives[] not null default '{}',
  created_at timestamptz not null default now()
);

-- RLS 활성화
alter table narratives enable row level security;
alter table narrative_bundles enable row level security;

-- narrative_bundles: 모든 인증된 유저가 조회 가능, 관리자만 수정 가능
create policy "authenticated can view narrative_bundles"
  on narrative_bundles
  for select
  to authenticated
  using (true);

create policy "admins can insert narrative_bundles"
  on narrative_bundles
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update narrative_bundles"
  on narrative_bundles
  for update
  to authenticated
  using (is_admin());

-- narratives: 모든 인증된 유저가 조회 가능, 관리자만 수정 가능
create policy "authenticated can view narratives"
  on narratives
  for select
  to authenticated
  using (true);

create policy "admins can insert narratives"
  on narratives
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update narratives"
  on narratives
  for update
  to authenticated
  using (is_admin());

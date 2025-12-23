-- behavior_priorities 테이블 (모든 behavior의 우선순위 통합 관리)
create table behavior_priorities (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,

  -- behavior 참조 (정확히 하나만 not null이어야 함)
  need_behavior_id uuid references need_behaviors(id) on delete cascade,
  building_behavior_id uuid references building_behaviors(id) on delete cascade,
  item_behavior_id uuid references item_behaviors(id) on delete cascade,

  priority integer not null default 0,

  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  -- 정확히 하나의 behavior만 참조해야 함
  constraint chk_behavior_priorities_one_behavior check (
    num_nonnulls(need_behavior_id, building_behavior_id, item_behavior_id) = 1
  ),

  -- 각 behavior당 하나의 priority만 존재
  constraint uq_behavior_priorities_need unique (need_behavior_id),
  constraint uq_behavior_priorities_building unique (building_behavior_id),
  constraint uq_behavior_priorities_item unique (item_behavior_id)
);

-- RLS 정책
alter table behavior_priorities enable row level security;

create policy "anyone can view behavior_priorities"
  on behavior_priorities
  for select
  to public
  using (true);

create policy "admins can insert behavior_priorities"
  on behavior_priorities
  for insert
  to authenticated
  with check (is_admin());

create policy "admins can update behavior_priorities"
  on behavior_priorities
  for update
  to authenticated
  using (is_admin());

create policy "admins can delete behavior_priorities"
  on behavior_priorities
  for delete
  to authenticated
  using (is_admin());

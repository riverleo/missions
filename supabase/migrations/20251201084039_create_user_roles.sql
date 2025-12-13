-- role enum 타입 정의
create type user_role_type as enum ('admin');

-- user_roles 테이블
create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type user_role_type not null,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  created_by uuid,
  deleted_at timestamptz,
  deleted_by uuid
);

-- 삭제되지 않은 레코드 중에서 user_id는 유일해야 함
create unique index uq_user_roles_user_id
  on user_roles(user_id)
  where deleted_at is null;

-- 관리자 권한 확인 함수
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid())
    and type = 'admin'
    and deleted_at is null
  );
$$ language sql security definer
set search_path = '';

-- 현재 유저의 user_role id 반환 함수
create or replace function current_user_role_id()
returns uuid as $$
  select id from public.user_roles
  where user_id = (select auth.uid())
  and deleted_at is null
  limit 1;
$$ language sql security definer
set search_path = '';

-- created_by, deleted_by FK 및 default 추가
alter table user_roles
  add constraint fk_user_roles_created_by foreign key (created_by) references user_roles(id) on delete set null,
  add constraint fk_user_roles_deleted_by foreign key (deleted_by) references user_roles(id) on delete set null,
  alter column created_by set default current_user_role_id();

-- RLS 활성화
alter table user_roles enable row level security;

-- 유저는 자신의 역할을 조회할 수 있고, 관리자는 모든 역할을 조회할 수 있음
create policy "authenticated can view roles"
  on user_roles
  for select
  to authenticated
  using (
    deleted_at is null
    and (is_me(user_id) or is_admin())
  );

-- 관리자는 역할을 추가할 수 있음
create policy "admins can insert roles"
  on user_roles
  for insert
  to authenticated
  with check (is_admin());

-- 관리자는 역할을 수정할 수 있음 (soft delete 포함)
create policy "admins can update roles"
  on user_roles
  for update
  to authenticated
  using (is_admin());

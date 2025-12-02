-- role enum 타입 정의
create type user_role_type as enum ('admin');

-- user_roles 테이블
create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type user_role_type not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 삭제되지 않은 레코드 중에서 user_id는 유일해야 함
create unique index user_roles_uniq_user_id
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

-- RLS 활성화
alter table user_roles enable row level security;

-- 모든 인증된 유저는 자신의 역할을 조회할 수 있음 (soft delete 제외)
create policy "users can view their own role"
  on user_roles
  for select
  to authenticated
  using ((select auth.uid()) = user_id and deleted_at is null);

-- 관리자는 모든 사용자의 역할을 조회할 수 있음 (soft delete 제외)
create policy "admins can view all roles"
  on user_roles
  for select
  to authenticated
  using (deleted_at is null and is_admin());

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

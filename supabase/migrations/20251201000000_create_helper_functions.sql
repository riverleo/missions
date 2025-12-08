-- 현재 유저 확인 함수
create or replace function is_me(target_user_id uuid)
returns boolean as $$
  select (select auth.uid()) = target_user_id;
$$ language sql stable
set search_path = '';

-- updated_at 자동 업데이트 함수
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql
set search_path = '';

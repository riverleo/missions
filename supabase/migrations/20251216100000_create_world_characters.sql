-- 월드 소유자 확인 함수 (world_* 테이블 삭제 이후에도 공용으로 유지)
create or replace function is_world_owner(wid uuid)
returns boolean as $$
  select exists (
    select 1 from public.worlds where id = wid and user_id = auth.uid()
  );
$$ language sql security definer
set search_path = '';

-- world_characters 테이블은 snapshot 방식으로 전환되어 삭제됨 (20260305220000_sync_strategy)

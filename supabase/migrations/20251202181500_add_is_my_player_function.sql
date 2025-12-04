-- 현재 유저의 플레이어 확인 함수
create or replace function is_my_player(check_player_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.players
    where players.id = check_player_id
    and players.user_id = (select auth.uid())
    and players.deleted_at is null
  );
$$ language sql stable
set search_path = '';

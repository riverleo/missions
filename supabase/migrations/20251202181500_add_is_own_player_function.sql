-- 현재 유저의 플레이어 확인 함수
create or replace function is_own_player(target_user_id uuid, target_player_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.players
    where players.id = target_player_id
    and players.user_id = target_user_id
    and public.is_me(target_user_id)
  );
$$ language sql stable
set search_path = '';

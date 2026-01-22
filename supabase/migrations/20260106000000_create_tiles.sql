-- Enums
create type tile_state_type as enum ('idle', 'damaged_1', 'damaged_2');

-- tiles: 재사용 가능한 타일 타입 정의
create table tiles (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  name text not null default '',
  max_durability int not null default 1000,

  -- Audit
  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint uq_tiles_scenario_id_name unique (scenario_id, name)
);

alter table tiles enable row level security;

create policy "admins can view tiles"
  on tiles for select
  using (is_admin());

create policy "admins can insert tiles"
  on tiles for insert
  to authenticated
  with check (is_admin());

create policy "admins can update tiles"
  on tiles for update
  to authenticated
  using (is_admin());

create policy "admins can delete tiles"
  on tiles for delete
  to authenticated
  using (is_admin());

-- tile_states: 타일 스프라이트 상태
create table tile_states (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  tile_id uuid not null references tiles(id) on delete cascade,
  type tile_state_type not null default 'idle',

  -- 스프라이트
  atlas_name text not null,
  frame_from int,
  frame_to int,
  fps int,
  loop loop_mode not null default 'loop',

  -- 상태 활성화 조건 (내구도 기반)
  min_durability int not null default 0,
  max_durability int not null default 1000,

  -- Audit
  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint uq_tile_states_tile_id_type unique (tile_id, type)
);

alter table tile_states enable row level security;

create policy "admins can view tile_states"
  on tile_states for select
  using (is_admin());

create policy "admins can insert tile_states"
  on tile_states for insert
  to authenticated
  with check (is_admin());

create policy "admins can update tile_states"
  on tile_states for update
  to authenticated
  using (is_admin());

create policy "admins can delete tile_states"
  on tile_states for delete
  to authenticated
  using (is_admin());

-- terrains_tiles: terrain과 tiles 매핑 테이블
create table terrains_tiles (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  terrain_id uuid not null references terrains(id) on delete cascade,
  tile_id uuid not null references tiles(id) on delete cascade,

  -- 맵 자동 생성 설정
  spawn_weight int not null default 100,
  min_cluster_size int not null default 1,
  max_cluster_size int not null default 1,

  -- Audit
  created_at timestamptz not null default now(),
  created_by uuid default current_user_role_id() references user_roles(id) on delete set null,

  constraint uq_terrains_tiles_terrain_id_tile_id unique (terrain_id, tile_id)
);

alter table terrains_tiles enable row level security;

create policy "admins can view terrains_tiles"
  on terrains_tiles for select
  using (is_admin());

create policy "admins can insert terrains_tiles"
  on terrains_tiles for insert
  to authenticated
  with check (is_admin());

create policy "admins can update terrains_tiles"
  on terrains_tiles for update
  to authenticated
  using (is_admin());

create policy "admins can delete terrains_tiles"
  on terrains_tiles for delete
  to authenticated
  using (is_admin());

-- world_tile_maps: 월드별 타일맵 (sparse storage)
create table world_tile_maps (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references scenarios(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  world_id uuid not null references worlds(id) on delete cascade,
  terrain_id uuid not null references terrains(id) on delete cascade,

  -- 타일이 배치된 위치만 저장
  -- 구조: {"x,y": {"tile_id": "...", "durability": 100}, ...}
  data jsonb not null default '{}',

  -- Audit
  created_at timestamptz not null default now(),
  deleted_at timestamptz,

  constraint uq_world_tile_maps_world_id unique (world_id)
);

alter table world_tile_maps enable row level security;

create policy "anyone can view world_tile_maps"
  on world_tile_maps for select
  using (deleted_at is null);

create policy "owner or admin can insert world_tile_maps"
  on world_tile_maps for insert
  to authenticated
  with check (is_world_owner(world_id) or is_admin());

create policy "owner or admin can update world_tile_maps"
  on world_tile_maps for update
  to authenticated
  using (
    (is_world_owner(world_id) or is_admin())
    and (deleted_at is null or is_admin())
  );

create policy "admin can delete world_tile_maps"
  on world_tile_maps for delete
  to authenticated
  using (is_admin());

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
  loop loop_type not null default 'loop',

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

-- world_tile_maps 테이블은 snapshot 방식으로 전환되어 삭제됨 (20260305220000_sync_strategy)

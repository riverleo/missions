-- world_characters 테이블에 held_world_item_id 컬럼 추가
alter table world_characters
add column held_world_item_id uuid references world_items(id) on delete set null;

-- held_world_item_id 인덱스 추가 (조회 성능 향상)
create index idx_world_characters_held_world_item_id on world_characters(held_world_item_id);

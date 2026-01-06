-- building_states.condition_id에 conditions 테이블 FK 추가
alter table building_states
  add constraint fk_building_states_condition_id
  foreign key (condition_id) references conditions(id) on delete set null;

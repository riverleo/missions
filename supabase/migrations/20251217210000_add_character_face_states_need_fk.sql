-- character_face_states.need_id에 needs 테이블 FK 추가
alter table character_face_states
  add constraint fk_character_face_states_need_id
  foreign key (need_id) references needs(id) on delete set null;

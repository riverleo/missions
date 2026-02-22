-- increase_per_tick는 0보다 커야 한다.
-- 기존 0 이하 데이터는 최소 허용값(0.1)으로 보정한다.

update need_fulfillments
set increase_per_tick = 0.1
where increase_per_tick <= 0;

alter table need_fulfillments
alter column increase_per_tick set default 0.1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_need_fulfillments_increase_per_tick_positive'
  ) then
    alter table need_fulfillments
    add constraint chk_need_fulfillments_increase_per_tick_positive
    check (increase_per_tick > 0);
  end if;
end $$;

update condition_fulfillments
set increase_per_tick = 0.1
where increase_per_tick <= 0;

alter table condition_fulfillments
alter column increase_per_tick set default 0.1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_condition_fulfillments_increase_per_tick_positive'
  ) then
    alter table condition_fulfillments
    add constraint chk_condition_fulfillments_increase_per_tick_positive
    check (increase_per_tick > 0);
  end if;
end $$;

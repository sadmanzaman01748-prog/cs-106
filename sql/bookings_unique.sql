-- =====================================================
-- CAT CAFE - ONE BOOKING PER MEMBER PER SESSION
-- This rule was added by hand in the SQL Editor early on (after the
-- duplicate test bookings). This file records it for the repo.
-- Safe to run more than once: it does nothing if the rule already exists.
-- =====================================================

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    where c.conrelid = 'public.bookings'::regclass
      and c.contype = 'u'
      and (select array_agg(a.attname::text order by a.attname)
           from pg_attribute a
           where a.attrelid = c.conrelid and a.attnum = any (c.conkey))
          = array['session_id', 'user_id']
  ) then
    alter table public.bookings
      add constraint bookings_user_session_unique unique (user_id, session_id);
  end if;
end $$;

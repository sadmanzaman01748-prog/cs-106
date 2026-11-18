-- =====================================================
-- CAT CAFE - CHOOSE A CAT WHEN BOOKING
-- Run in Supabase > SQL Editor AFTER harden.sql. Safe to run more than once.
--  - A booking can name one cat the member would like to meet (optional).
--  - Only ONE member can choose a given cat in a given session.
--  - Everyone can see which cats are already taken (but not who took them).
-- =====================================================

alter table public.bookings
  add column if not exists cat_id bigint references public.cats(id) on delete set null;

-- One member per cat per session (bookings without a cat are not limited)
create unique index if not exists bookings_one_member_per_cat
  on public.bookings (session_id, cat_id)
  where cat_id is not null;

create index if not exists bookings_cat_id_idx on public.bookings (cat_id);

-- Which cats are already chosen in upcoming sessions.
-- Members can't read other people's bookings, so this function answers
-- that one question safely: it returns ids only, never who booked.
create or replace function public.get_taken_cats()
returns table (session_id bigint, cat_id bigint)
language sql
stable
security definer
set search_path = public
as $$
  select b.session_id, b.cat_id
  from public.bookings b
  join public.sessions s on s.id = b.session_id
  where b.cat_id is not null
    and (s.session_date + s.start_time) > (now() at time zone 'Pacific/Auckland');
$$;

revoke execute on function public.get_taken_cats() from public;
grant execute on function public.get_taken_cats() to anon, authenticated;

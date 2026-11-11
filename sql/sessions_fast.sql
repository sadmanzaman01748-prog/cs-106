-- =====================================================
-- CAT CAFE - FAST SESSIONS (one request instead of ~43)
-- Run in Supabase > SQL Editor. Safe to run more than once.
-- Returns every session with a "spotsLeft" number added.
-- =====================================================

create or replace function public.get_sessions_with_spots()
returns jsonb
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      to_jsonb(s) || jsonb_build_object(
        'spotsLeft',
        s.capacity - coalesce(
          (select sum(b.guests) from public.bookings b where b.session_id = s.id), 0
        )
      )
      order by s.session_date, s.start_time
    ),
    '[]'::jsonb
  )
  from public.sessions s;
$$;

grant execute on function public.get_sessions_with_spots() to anon, authenticated;

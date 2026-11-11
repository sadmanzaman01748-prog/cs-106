-- =====================================================
-- CAT CAFÉ - SAMPLE DATA FOR USERS, RESCUED CATS AND BOOKINGS
-- Run in Supabase > SQL Editor AFTER harden.sql, and AFTER creating
-- these 5 users in Authentication > Users > Add user
-- (password test12345, tick "Auto Confirm User" for each):
--   aroha@gmail.com, ben@gmail.com, chloe@gmail.com,
--   dev@gmail.com, eli@gmail.com
-- Safe to re-run.
-- =====================================================

-- ---------- 1. PROPER NAMES AND PHONES ----------
-- (the sign-up trigger already made a profile row for each user)

update public.profiles p
set full_name = v.full_name,
    phone = v.phone
from auth.users u
join (values
  ('aroha@gmail.com', 'Aroha Ngata',  '021 555 0101'),
  ('ben@gmail.com',   'Ben Carter',   '021 555 0102'),
  ('chloe@gmail.com', 'Chloe Wang',   '021 555 0103'),
  ('dev@gmail.com',   'Dev Patel',    '021 555 0104'),
  ('eli@gmail.com',   'Eli Fonoti',   '021 555 0105')
) as v(email, full_name, phone) on v.email = u.email
where p.id = u.id;

-- ---------- 2. MEMBERS WHO RESCUED SOME CATS ----------
-- Sets the owner; the database fills in the rescuer's name automatically.

update public.cats c
set owner_id = u.id
from auth.users u
join (values
  ('Willow', 'aroha@gmail.com'),
  ('Pixel',  'ben@gmail.com'),
  ('Maple',  'chloe@gmail.com'),
  ('Echo',   'dev@gmail.com'),
  ('Taco',   'eli@gmail.com'),
  ('Bean',   'aroha@gmail.com')
) as v(cat_name, email) on v.email = u.email
where c.name = v.cat_name;

-- ---------- 3. SAMPLE BOOKINGS ----------
-- session_number 0 = the next upcoming session, 1 = the one after, and so on.
-- The booking rules (capacity, no past sessions) still apply.

insert into public.bookings (user_id, session_id, guests)
select u.id, s.id, v.guests
from (values
  ('aroha@gmail.com', 1, 2),
  ('aroha@gmail.com', 4, 2),
  ('ben@gmail.com',   1, 2),
  ('ben@gmail.com',   6, 4),
  ('chloe@gmail.com', 2, 1),
  ('chloe@gmail.com', 9, 3),
  ('dev@gmail.com',   4, 3),
  ('eli@gmail.com',   7, 2),
  ('eli@gmail.com',  10, 5)
) as v(email, session_number, guests)
join auth.users u on u.email = v.email
join (
  select id,
         row_number() over (order by session_date, start_time) - 1 as session_number
  from public.sessions
  where (session_date + start_time) > (now() at time zone 'Pacific/Auckland')
) s on s.session_number = v.session_number
on conflict (user_id, session_id) do nothing;

-- ---------- CHECK ----------
select 'profiles' as table_name, count(*) from public.profiles
union all select 'cats', count(*) from public.cats
union all select 'sessions', count(*) from public.sessions
union all select 'bookings', count(*) from public.bookings;

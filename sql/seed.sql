-- =====================================================
-- CAT CAFÉ - SEED DATA
-- Run in Supabase > SQL Editor AFTER setup.sql
-- =====================================================

-- ---------- CATS ----------
-- photo_url is left empty for now; fill it in after uploading photos to Storage
insert into public.cats (name, breed, personality) values
  ('Mochi',    'Ragdoll',          'Gentle floor-flopper who loves being carried'),
  ('Biscuit',  'Ginger tabby',     'Chatty food enthusiast, will follow you everywhere'),
  ('Luna',     'Black domestic',   'Shy at first, then your best friend for life'),
  ('Pickles',  'British shorthair','Grumpy face, secretly a cuddle monster'),
  ('Nimbus',   'Russian blue',     'Calm, elegant and very judgy about snacks'),
  ('Tofu',     'Scottish fold',    'Sleepy loaf who naps on any available lap'),
  ('Ziggy',    'Bengal',           'Zoomies champion, loves feather toys'),
  ('Waffles',  'Calico',           'Curious explorer who inspects every bag');

-- ---------- SESSIONS ----------
-- 3 sessions a day (10am, 1pm, 4pm) for the next 7 days, 8 seats each.
-- Uses current_date so the dates are always upcoming.
insert into public.sessions (session_date, start_time, capacity)
select current_date + d, slot_time, 8
from generate_series(1, 7) as d
cross join (values ('10:00'::time), ('13:00'::time), ('16:00'::time)) as slots(slot_time);

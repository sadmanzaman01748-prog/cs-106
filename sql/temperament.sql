-- =====================================================
-- CAT CAFE - TEMPERAMENT (for the filter buttons on the cats page)
-- Run in Supabase > SQL Editor. Safe to run more than once.
-- Gives every cafe cat one of: playful, snuggly, calm.
-- Cats added later by members have no temperament; the cats page
-- then falls back to the words in their personality text.
-- =====================================================

alter table public.cats
  add column if not exists temperament text;

alter table public.cats drop constraint if exists cats_temperament_check;
alter table public.cats
  add constraint cats_temperament_check
  check (temperament in ('playful', 'snuggly', 'calm'));

update public.cats c
set temperament = v.temperament
from (values
  -- snuggly: lap cats and cuddlers
  ('Mochi', 'snuggly'), ('Pickles', 'snuggly'), ('Tofu', 'snuggly'),
  ('Manuka', 'snuggly'), ('Hobbit', 'snuggly'), ('Marmite', 'snuggly'),
  ('Ginger', 'snuggly'), ('Bean', 'snuggly'), ('Noodle', 'snuggly'),
  ('Maple', 'snuggly'), ('Fudge', 'snuggly'), ('Shadow', 'snuggly'),
  ('Chai', 'snuggly'),
  -- calm: quiet observers and nappers
  ('Luna', 'calm'), ('Nimbus', 'calm'), ('Pavlova', 'calm'),
  ('Tama', 'calm'), ('Sir Whiskerton', 'calm'), ('Pepper', 'calm'),
  ('Salem', 'calm'), ('Mango', 'calm'), ('Pumpkin', 'calm'),
  ('Smokey', 'calm'), ('Muffin', 'calm'), ('Pebbles', 'calm'),
  ('Sushi', 'calm'), ('Latte', 'calm'), ('Marshmallow', 'calm'),
  ('Willow', 'calm'),
  -- playful: explorers, talkers and zoomers
  ('Biscuit', 'playful'), ('Ziggy', 'playful'), ('Waffles', 'playful'),
  ('Kiwi', 'playful'), ('Tui', 'playful'), ('Jandal', 'playful'),
  ('Fantail', 'playful'), ('Olive', 'playful'), ('Churro', 'playful'),
  ('Oreo', 'playful'), ('Peanut', 'playful'), ('Clover', 'playful'),
  ('Basil', 'playful'), ('Cinnamon', 'playful'), ('Pixel', 'playful'),
  ('Comet', 'playful'), ('Taco', 'playful'), ('Jellybean', 'playful'),
  ('Echo', 'playful')
) as v(name, temperament)
where c.name = v.name;

-- Check: how many cats are in each group (expect 19 playful, 13 snuggly, 16 calm)
select coalesce(temperament, '(none)') as temperament, count(*) as cats
from public.cats
group by temperament
order by temperament;

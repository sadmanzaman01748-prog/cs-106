-- =====================================================
-- CAT CAFÉ - 40 MORE CATS (48 total with the first 8)
-- Run in Supabase > SQL Editor.
-- Skips any cat whose name already exists, so it is safe to re-run.
-- photo_url is added later, once photos are uploaded.
-- =====================================================

insert into public.cats (name, breed, personality)
select v.name, v.breed, v.personality
from (values
  ('Kiwi',          'Domestic shorthair', 'Fearless explorer who treats the whole cafe as her territory'),
  ('Manuka',        'Ginger tabby',       'Sweet as honey and always first in line for a cuddle'),
  ('Tui',           'Black domestic',     'Chirpy talker who answers every question you ask him'),
  ('Hobbit',        'Maine Coon',         'Gentle giant who thinks he is a lap cat despite his size'),
  ('Pavlova',       'Persian',            'Fluffy and dramatic, expects to be admired at all times'),
  ('Marmite',       'Burmese',            'You either love him or you adore him'),
  ('Jandal',        'Tuxedo',             'Always dressed for a party and happy to be the centre of it'),
  ('Fantail',       'Abyssinian',         'Cannot sit still, follows feather toys everywhere'),
  ('Tama',          'Norwegian forest',   'Calm and wise, watches the room from the top shelf'),
  ('Sir Whiskerton','British shorthair',  'Very dignified until someone opens a pouch of treats'),
  ('Olive',         'Tortoiseshell',      'Has strong opinions and shares every one of them'),
  ('Pepper',        'Black domestic',     'Shy but brave, loves a quiet corner and a gentle chin scratch'),
  ('Ginger',        'Ginger tabby',       'Loud purr, louder meow, biggest heart in the building'),
  ('Salem',         'Black domestic',     'Mysterious and elegant, appears out of nowhere'),
  ('Mango',         'Ginger tabby',       'Sunny personality who naps in every patch of warm light'),
  ('Churro',        'Siamese',            'Chatty, clever and extremely good at opening doors'),
  ('Bean',          'Domestic shorthair', 'Tiny, round and always rolling over for tummy rubs'),
  ('Noodle',        'Ragdoll',            'Goes completely floppy the moment you pick him up'),
  ('Pumpkin',       'Ginger tabby',       'Round, relaxed and the undisputed cafe sleep champion'),
  ('Oreo',          'Tuxedo',             'Playful troublemaker who steals pens and hair ties'),
  ('Smokey',        'Russian blue',       'Quiet observer who chooses one favourite visitor per day'),
  ('Peanut',        'Domestic shorthair', 'The smallest cat here with the biggest personality'),
  ('Maple',         'Birman',             'Soft, gentle and happy to be brushed for hours'),
  ('Clover',        'Calico',             'Lucky charm who loves chasing bubbles'),
  ('Basil',         'Grey tabby',         'Curious about everything, especially closed cupboards'),
  ('Cinnamon',      'Abyssinian',         'Warm, energetic and always up for a game of chase'),
  ('Fudge',         'Burmese',            'Sleek and affectionate, loves to sit on shoulders'),
  ('Muffin',        'Scottish fold',      'Folded ears, loafy shape and a very serious nap schedule'),
  ('Pixel',         'Bengal',             'Leaps higher than seems possible and lands like a ninja'),
  ('Comet',         'Domestic shorthair', 'Streaks through the room at top speed, then naps for hours'),
  ('Pebbles',       'Grey tabby',         'Steady and sweet, the perfect first-time cat friend'),
  ('Shadow',        'Black domestic',     'Follows quietly and appears on your lap without warning'),
  ('Sushi',         'Domestic longhair',  'Rolls around in the sun and demands fish-flavoured treats'),
  ('Taco',          'Calico',             'Spicy attitude with a soft centre'),
  ('Latte',         'Birman',             'Creamy coat, calm manner and a very gentle purr'),
  ('Chai',          'Ginger tabby',       'Cosy, warm and best friends with anyone holding a cup of tea'),
  ('Marshmallow',   'Persian',            'Pure white fluff who prefers to be admired from a cushion'),
  ('Jellybean',     'Tortoiseshell',      'A mix of colours and moods, never boring'),
  ('Echo',          'Siamese',            'Repeats every sound you make, just a bit louder'),
  ('Willow',        'Norwegian forest',   'Graceful climber who loves watching the world from above')
) as v(name, breed, personality)
where not exists (
  select 1 from public.cats c where c.name = v.name
);

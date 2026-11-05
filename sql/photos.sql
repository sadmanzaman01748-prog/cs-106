-- =====================================================
-- CAT CAFÉ - LINK EACH CAT TO ITS PHOTO
-- Run in Supabase > SQL Editor AFTER uploading all 48 images
-- from cat-photos.zip into the cat-photos bucket (Storage).
-- Safe to re-run.
-- =====================================================

update public.cats c
set photo_url = 'https://azaffkwcsgqjolmpxwoh.supabase.co/storage/v1/object/public/cat-photos/' || v.file
from (values
  ('Mochi', 'cat-mochi.png'),
  ('Biscuit', 'cat-biscuit.png'),
  ('Luna', 'cat-luna.png'),
  ('Pickles', 'cat-pickles.png'),
  ('Nimbus', 'cat-nimbus.png'),
  ('Tofu', 'cat-tofu.png'),
  ('Ziggy', 'cat-ziggy.png'),
  ('Waffles', 'cat-waffles.png'),
  ('Kiwi', 'cat-kiwi.png'),
  ('Manuka', 'cat-manuka.png'),
  ('Tui', 'cat-tui.png'),
  ('Hobbit', 'cat-hobbit.png'),
  ('Pavlova', 'cat-pavlova.png'),
  ('Marmite', 'cat-marmite.png'),
  ('Jandal', 'cat-jandal.png'),
  ('Fantail', 'cat-fantail.png'),
  ('Tama', 'cat-tama.png'),
  ('Sir Whiskerton', 'cat-sir-whiskerton.png'),
  ('Olive', 'cat-olive.png'),
  ('Pepper', 'cat-pepper.png'),
  ('Ginger', 'cat-ginger.png'),
  ('Salem', 'cat-salem.png'),
  ('Mango', 'cat-mango.png'),
  ('Churro', 'cat-churro.png'),
  ('Bean', 'cat-bean.png'),
  ('Noodle', 'cat-noodle.png'),
  ('Pumpkin', 'cat-pumpkin.png'),
  ('Oreo', 'cat-oreo.png'),
  ('Smokey', 'cat-smokey.png'),
  ('Peanut', 'cat-peanut.png'),
  ('Maple', 'cat-maple.png'),
  ('Clover', 'cat-clover.png'),
  ('Basil', 'cat-basil.png'),
  ('Cinnamon', 'cat-cinnamon.png'),
  ('Fudge', 'cat-fudge.png'),
  ('Muffin', 'cat-muffin.png'),
  ('Pixel', 'cat-pixel.png'),
  ('Comet', 'cat-comet.png'),
  ('Pebbles', 'cat-pebbles.png'),
  ('Shadow', 'cat-shadow.png'),
  ('Sushi', 'cat-sushi.png'),
  ('Taco', 'cat-taco.png'),
  ('Latte', 'cat-latte.png'),
  ('Chai', 'cat-chai.png'),
  ('Marshmallow', 'cat-marshmallow.png'),
  ('Jellybean', 'cat-jellybean.png'),
  ('Echo', 'cat-echo.png'),
  ('Willow', 'cat-willow.png')
) as v(name, file)
where c.name = v.name;

-- Check: this should return 0 rows (every cat has a photo)
select name from public.cats where photo_url is null;

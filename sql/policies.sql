-- =====================================================
-- CAT CAFÉ - WRITE ACCESS FOR LOGGED-IN USERS
-- Run in Supabase > SQL Editor AFTER setup.sql and seed.sql
-- "authenticated" = anyone who is logged in
-- =====================================================

-- ---------- CATS: any logged-in user can add, edit and delete ----------
create policy "logged in users add cats"
  on public.cats for insert to authenticated
  with check (true);

create policy "logged in users edit cats"
  on public.cats for update to authenticated
  using (true) with check (true);

create policy "logged in users delete cats"
  on public.cats for delete to authenticated
  using (true);

-- ---------- SESSIONS: any logged-in user can add, edit and delete ----------
create policy "logged in users add sessions"
  on public.sessions for insert to authenticated
  with check (true);

create policy "logged in users edit sessions"
  on public.sessions for update to authenticated
  using (true) with check (true);

create policy "logged in users delete sessions"
  on public.sessions for delete to authenticated
  using (true);

-- ---------- BOOKINGS: users can edit their own bookings ----------
create policy "edit own bookings"
  on public.bookings for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- PROFILES: users can create their own profile row ----------
create policy "create own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

-- ---------- STORAGE: cat photo bucket ----------
-- Public bucket so photos show on the website
insert into storage.buckets (id, name, public)
values ('cat-photos', 'cat-photos', true)
on conflict (id) do nothing;

create policy "anyone can view cat photos"
  on storage.objects for select
  using (bucket_id = 'cat-photos');

create policy "logged in users upload cat photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'cat-photos');

create policy "logged in users update cat photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'cat-photos');

create policy "logged in users delete cat photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'cat-photos');

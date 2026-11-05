-- =====================================================
-- CAT CAFÉ - HARDENING SCRIPT (version 2: members own their cats)
-- Run in Supabase > SQL Editor AFTER setup, seed, policies and cats_seed.
-- Safe to run more than once.
-- A yellow "destructive operations" warning is expected
-- (it deletes old past sessions that nobody booked).
-- =====================================================

-- ---------- 1. ADMIN ROLE ----------

alter table public.profiles
  add column if not exists role text not null default 'user';

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('user', 'admin'));

-- Helper: is the logged-in user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Users can edit ONLY their name and phone, never their role,
-- and can't insert their own profile row (the sign-up trigger does that).
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

drop policy if exists "create own profile" on public.profiles;
revoke insert on public.profiles from authenticated;

-- ---------- 2. CATS: MEMBERS OWN THE CATS THEY RESCUED ----------

-- Who added the cat (empty = a café cat, managed by admins only)
alter table public.cats
  add column if not exists owner_id uuid references public.profiles(id) on delete set null;
alter table public.cats alter column owner_id set default auth.uid();

-- Name of the rescuer, shown on the cat's card
alter table public.cats add column if not exists rescuer_name text;

create or replace function public.set_rescuer_name()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_id is not null then
    select full_name into new.rescuer_name
    from public.profiles where id = new.owner_id;
  end if;
  return new;
end;
$$;

drop trigger if exists set_rescuer_name_before_write on public.cats;
create trigger set_rescuer_name_before_write
  before insert or update of owner_id on public.cats
  for each row execute function public.set_rescuer_name();

-- Stop spam: a member can list at most 10 cats
create or replace function public.check_cat_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() and (
    select count(*) from public.cats where owner_id = new.owner_id
  ) >= 10 then
    raise exception 'You can list at most 10 cats.';
  end if;
  return new;
end;
$$;

drop trigger if exists check_cat_limit_before_insert on public.cats;
create trigger check_cat_limit_before_insert
  before insert on public.cats
  for each row execute function public.check_cat_limit();

-- Users can change only these columns (never owner_id or rescuer_name)
revoke update on public.cats from authenticated;
grant update (name, breed, personality, photo_url) on public.cats to authenticated;

-- Remove all earlier cat policies, then add owner-or-admin rules
drop policy if exists "logged in users add cats"    on public.cats;
drop policy if exists "logged in users edit cats"   on public.cats;
drop policy if exists "logged in users delete cats" on public.cats;
drop policy if exists "admins add cats"             on public.cats;
drop policy if exists "admins edit cats"            on public.cats;
drop policy if exists "admins delete cats"          on public.cats;
drop policy if exists "add own cats"                on public.cats;
drop policy if exists "edit own cats"               on public.cats;
drop policy if exists "delete own cats"             on public.cats;

create policy "add own cats" on public.cats for insert to authenticated
  with check (owner_id = auth.uid() or public.is_admin());
create policy "edit own cats" on public.cats for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());
create policy "delete own cats" on public.cats for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

-- ---------- 3. SESSIONS: ADMINS ONLY ----------

drop policy if exists "logged in users add sessions"   on public.sessions;
drop policy if exists "logged in users edit sessions"  on public.sessions;
drop policy if exists "logged in users delete sessions" on public.sessions;
drop policy if exists "admins add sessions"    on public.sessions;
drop policy if exists "admins edit sessions"   on public.sessions;
drop policy if exists "admins delete sessions" on public.sessions;
create policy "admins add sessions"    on public.sessions for insert to authenticated with check (public.is_admin());
create policy "admins edit sessions"   on public.sessions for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete sessions" on public.sessions for delete to authenticated using (public.is_admin());

-- Admins can also see all profiles and all bookings, and cancel any booking
drop policy if exists "admins read all profiles"  on public.profiles;
drop policy if exists "admins read all bookings"  on public.bookings;
drop policy if exists "admins cancel any booking" on public.bookings;
create policy "admins read all profiles"  on public.profiles for select to authenticated using (public.is_admin());
create policy "admins read all bookings"  on public.bookings for select to authenticated using (public.is_admin());
create policy "admins cancel any booking" on public.bookings for delete to authenticated using (public.is_admin());

-- ---------- 4. BOOKING RULES (enforced inside the database) ----------

create or replace function public.check_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  session_capacity int;
  session_start timestamp;
  seats_taken int;
begin
  -- Lock the session row so two people can't grab the last seat at once
  select capacity, (session_date + start_time)
    into session_capacity, session_start
  from public.sessions
  where id = new.session_id
  for update;

  -- No booking sessions that have already started (New Zealand time)
  if session_start < (now() at time zone 'Pacific/Auckland') then
    raise exception 'This session has already started or finished.';
  end if;

  -- Count seats already taken by other bookings
  select coalesce(sum(guests), 0) into seats_taken
  from public.bookings
  where session_id = new.session_id
    and id is distinct from new.id;

  if seats_taken + new.guests > session_capacity then
    raise exception 'Not enough places left in this session.';
  end if;

  return new;
end;
$$;

drop trigger if exists check_booking_before_write on public.bookings;
create trigger check_booking_before_write
  before insert or update of guests, session_id on public.bookings
  for each row execute function public.check_booking();

-- Capacity can't be lowered below the seats already booked
create or replace function public.check_session_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.capacity < (
    select coalesce(sum(guests), 0) from public.bookings where session_id = new.id
  ) then
    raise exception 'Capacity cannot be lower than the seats already booked.';
  end if;
  return new;
end;
$$;

drop trigger if exists check_session_capacity_before_update on public.sessions;
create trigger check_session_capacity_before_update
  before update of capacity on public.sessions
  for each row execute function public.check_session_capacity();

-- A session with bookings can't be deleted (no silent loss of bookings)
alter table public.bookings drop constraint if exists bookings_session_id_fkey;
alter table public.bookings
  add constraint bookings_session_id_fkey
  foreign key (session_id) references public.sessions(id) on delete restrict;

-- These functions are for triggers only, so nobody can call them directly
revoke execute on function public.check_booking()          from public, anon, authenticated;
revoke execute on function public.check_session_capacity() from public, anon, authenticated;
revoke execute on function public.check_cat_limit()        from public, anon, authenticated;
revoke execute on function public.set_rescuer_name()       from public, anon, authenticated;
revoke execute on function public.handle_new_user()        from public, anon, authenticated;

-- ---------- 5. PHOTO BUCKET ----------
-- Members upload into their OWN folder (named after their user id).
-- Admins can manage any file. Images only, 2 MB max.

drop policy if exists "logged in users upload cat photos" on storage.objects;
drop policy if exists "logged in users update cat photos" on storage.objects;
drop policy if exists "logged in users delete cat photos" on storage.objects;
drop policy if exists "admins upload cat photos" on storage.objects;
drop policy if exists "admins update cat photos" on storage.objects;
drop policy if exists "admins delete cat photos" on storage.objects;
drop policy if exists "members upload own cat photos" on storage.objects;
drop policy if exists "members update own cat photos" on storage.objects;
drop policy if exists "members delete own cat photos" on storage.objects;

create policy "members upload own cat photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'cat-photos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "members update own cat photos" on storage.objects for update to authenticated
  using (bucket_id = 'cat-photos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "members delete own cat photos" on storage.objects for delete to authenticated
  using (bucket_id = 'cat-photos'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

update storage.buckets
set file_size_limit = 2097152,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'cat-photos';

-- ---------- 6. FRESH SESSIONS ----------

-- Remove old past sessions that nobody booked
delete from public.sessions
where session_date < (now() at time zone 'Pacific/Auckland')::date
  and id not in (select session_id from public.bookings);

-- Add the next 14 days (3 sessions a day, 8 seats), skipping any that exist
insert into public.sessions (session_date, start_time, capacity)
select day::date, slot, 8
from generate_series(
       (now() at time zone 'Pacific/Auckland')::date,
       (now() at time zone 'Pacific/Auckland')::date + 13,
       interval '1 day'
     ) as day
cross join (values ('10:00'::time), ('13:00'::time), ('16:00'::time)) as slots(slot)
where not exists (
  select 1 from public.sessions s
  where s.session_date = day::date and s.start_time = slot
);

-- ---------- 7. MAKE YOUR TEST ACCOUNT AN ADMIN ----------
-- (Run here in the SQL Editor, users can't do this themselves.)

update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'test1@example.com');

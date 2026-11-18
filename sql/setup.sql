-- =====================================================
-- CAT CAFÉ - SUPABASE SETUP
-- Run this whole script once in Supabase > SQL Editor
-- Naming style: snake_case everywhere
-- =====================================================

-- ---------- 1. TABLES ----------

-- One row per user, linked to Supabase Auth
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text,
  created_at timestamptz not null default now()
);

-- The cats that live at the café
create table public.cats (
  id bigint generated always as identity primary key,
  name text not null,
  breed text,
  personality text,
  photo_url text
);

-- Time slots people can book
create table public.sessions (
  id bigint generated always as identity primary key,
  session_date date not null,
  start_time time not null,
  capacity int not null check (capacity > 0)
);

-- A user booking a session for some guests
create table public.bookings (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id bigint not null references public.sessions(id) on delete cascade,
  guests int not null check (guests between 1 and 6),
  created_at timestamptz not null default now()
);

-- ---------- 2. AUTO-CREATE PROFILE ON SIGN-UP ----------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'Guest'));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------- 3. ROW LEVEL SECURITY ----------

alter table public.profiles enable row level security;
alter table public.cats     enable row level security;
alter table public.sessions enable row level security;
alter table public.bookings enable row level security;

-- Anyone can browse cats and sessions
create policy "cats are public"
  on public.cats for select using (true);

create policy "sessions are public"
  on public.sessions for select using (true);

-- Users can only see and edit their own profile
create policy "read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Users can only see, create and cancel their own bookings
create policy "read own bookings"
  on public.bookings for select using (auth.uid() = user_id);

create policy "create own bookings"
  on public.bookings for insert with check (auth.uid() = user_id);

create policy "cancel own bookings"
  on public.bookings for delete using (auth.uid() = user_id);

-- ---------- 4. SPOTS LEFT HELPER ----------
-- RLS stops users seeing other people's bookings, so this function
-- (security definer) counts spots across everyone safely.

create function public.spots_left(p_session_id bigint)
returns int
language sql
security definer
set search_path = public
as $$
  select s.capacity - coalesce(sum(b.guests), 0)::int
  from public.sessions s
  left join public.bookings b on b.session_id = s.id
  where s.id = p_session_id
  group by s.capacity;
$$;

-- =====================================================
-- CAT CAFE - CONTACT MESSAGES
-- Run in Supabase > SQL Editor AFTER harden.sql. Safe to run more than once.
-- Anyone (logged in or not) can SEND a message.
-- Only admins can READ, mark as read, or DELETE messages.
-- =====================================================

create table if not exists public.contact_messages (
  id         bigint generated always as identity primary key,
  full_name  text not null check (char_length(full_name) between 1 and 100),
  email      text not null check (char_length(email) between 3 and 200 and email like '%_@_%'),
  subject    text not null check (char_length(subject) between 1 and 150),
  message    text not null check (char_length(message) between 1 and 2000),
  user_id    uuid default auth.uid() references public.profiles(id) on delete set null,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

-- Visitors may only fill in these four columns (they can't fake user_id or is_read)
revoke all on public.contact_messages from anon, authenticated;
grant insert (full_name, email, subject, message) on public.contact_messages to anon, authenticated;
grant select, delete on public.contact_messages to authenticated;
grant update (is_read) on public.contact_messages to authenticated;

drop policy if exists "anyone can send a message" on public.contact_messages;
drop policy if exists "admins read messages"      on public.contact_messages;
drop policy if exists "admins update messages"    on public.contact_messages;
drop policy if exists "admins delete messages"    on public.contact_messages;

create policy "anyone can send a message" on public.contact_messages
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());
create policy "admins read messages" on public.contact_messages
  for select to authenticated using (public.is_admin());
create policy "admins update messages" on public.contact_messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete messages" on public.contact_messages
  for delete to authenticated using (public.is_admin());

-- Stop spam: at most 5 messages per email address per hour
create or replace function public.check_message_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    select count(*) from public.contact_messages
    where lower(email) = lower(new.email)
      and created_at > now() - interval '1 hour'
  ) >= 5 then
    raise exception 'Too many messages from this email. Please try again later.';
  end if;
  return new;
end;
$$;

drop trigger if exists check_message_rate_before_insert on public.contact_messages;
create trigger check_message_rate_before_insert
  before insert on public.contact_messages
  for each row execute function public.check_message_rate();

revoke execute on function public.check_message_rate() from public, anon, authenticated;

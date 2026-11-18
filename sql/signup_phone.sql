-- =====================================================
-- CAT CAFÉ - SAVE THE PHONE NUMBER FROM THE SIGN-UP FORM
-- Run once in Supabase > SQL Editor. Safe to re-run.
-- The form must send the phone inside the sign-up metadata
-- under the name "phone" (see the JavaScript change).
-- =====================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Guest'),
    -- trim spaces, cap at 20 characters, and store empty as null
    nullif(left(trim(new.raw_user_meta_data->>'phone'), 20), '')
  );
  return new;
end;
$$;

-- ============================================================
-- Email-Spalte in profiles + Backfill + Trigger-Update
-- Datum: 08.08.2026
--
-- Problem:
--   InviteMembers-Suche konnte nur nach Namen suchen, weil
--   profiles keine email-Spalte hat.
--
-- Fix:
--   1. email-Spalte in profiles ergänzen
--   2. Bestehende Profile mit auth.users.emails befüllen
--   3. handle_new_user()-Trigger erweitern, sodass neue User
--      automatisch mit Email angelegt werden
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. email-Spalte ergänzen
-- ------------------------------------------------------------
alter table public.profiles add column if not exists email text;

-- ------------------------------------------------------------
-- 2. Backfill bestehender Profile
-- ------------------------------------------------------------
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is null
  and u.email is not null;

-- ------------------------------------------------------------
-- 3. handle_new_user()-Trigger erweitern
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, name, email, approved)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      coalesce(
        split_part(coalesce(new.email, ''), '@', 1),
        'Neuer Benutzer'
      )
    ),
    new.email,
    true
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

commit;
-- ============================================================
-- Profil-Upsert + Backfill für bestehende User
-- Datum: 08.08.2026
--
-- Problem:
--   User, die sich VOR dem Trigger (20260807150000) registriert
--   haben, haben kein Profil oder ein Profil mit leerem Namen.
--   update_own_profile_name macht nur UPDATE -> 0 Zeilen -> Name
--   wird nicht gespeichert, aber kein Fehler gemeldet.
--
-- Fix:
--   1. update_own_profile_name -> UPSERT (INSERT ON CONFLICT)
--   2. update_own_avatar_path -> UPSERT
--   3. Backfill: Profile für alle auth.users anlegen, die keins haben
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. update_own_profile_name -> UPSERT
-- ------------------------------------------------------------
create or replace function public.update_own_profile_name(profile_name text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if char_length(trim(profile_name)) < 1 or char_length(trim(profile_name)) > 80 then
    raise exception 'Profile name must be between 1 and 80 characters';
  end if;

  insert into public.profiles (id, name, approved)
  values (auth.uid(), trim(profile_name), true)
  on conflict (id) do update
    set name = excluded.name;
end;
$$;

grant execute on function public.update_own_profile_name(text) to authenticated;

-- ------------------------------------------------------------
-- 2. update_own_avatar_path -> UPSERT
-- ------------------------------------------------------------
create or replace function public.update_own_avatar_path(new_avatar_path text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new_avatar_path is not null
    and new_avatar_path <> (auth.uid()::text || '/avatar') then
    raise exception 'Invalid avatar path';
  end if;

  insert into public.profiles (id, name, approved, avatar_path)
  values (
    auth.uid(),
    coalesce(
      nullif(trim((select raw_user_meta_data ->> 'name' from auth.users where id = auth.uid())), ''),
      split_part(coalesce((select email from auth.users where id = auth.uid()), ''), '@', 1),
      'Neuer Benutzer'
    ),
    true,
    new_avatar_path
  )
  on conflict (id) do update
    set avatar_path = excluded.avatar_path;
end;
$$;

grant execute on function public.update_own_avatar_path(text) to authenticated;

-- ------------------------------------------------------------
-- 3. Backfill: Profile für alle auth.users anlegen, die keins haben
-- ------------------------------------------------------------
insert into public.profiles (id, name, approved)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
    split_part(coalesce(u.email, ''), '@', 1),
    'Neuer Benutzer'
  ),
  true
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

commit;
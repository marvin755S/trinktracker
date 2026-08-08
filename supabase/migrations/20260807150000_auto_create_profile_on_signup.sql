-- ============================================================
-- Automatische Profilerstellung bei neuer Registrierung
-- Datum: 08.08.2026
--
-- Problem:
--   Bei der Registrierung mit E-Mail-Bestätigung existiert noch
--   keine Session (auth.uid() = NULL). Der client-seitige INSERT
--   in profiles schlägt deshalb mit RLS-Fehler fehl.
--
-- Fix:
--   Ein AFTER INSERT TRIGGER auf auth.users erstellt das Profil
--   automatisch mit erhöhten Rechten (security definer).
-- ============================================================

begin;

-- Funktion: Erstellt Profil für neuen Supabase-Auth-User
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, name, approved)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      coalesce(
        split_part(coalesce(new.email, ''), '@', 1),
        'Neuer Benutzer'
      )
    ),
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger auf auth.users: Profil automatisch anlegen
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

commit;
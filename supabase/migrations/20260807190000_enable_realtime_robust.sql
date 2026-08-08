-- ============================================================
-- Realtime robust aktivieren (auch wenn Publikation fehlt)
-- Datum: 08.08.2026
--
-- Erstellt die supabase_realtime-Publikation, falls sie nicht
-- existiert, und fügt die Tabellen hinzu.
-- ============================================================

begin;

-- Publikation erstellen, falls nicht vorhanden
do $$
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    create publication supabase_realtime;
  end if;
end;
$$;

-- Tabellen zur Publikation hinzufügen (idempotent)
do $$
begin
  -- invitations
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'invitations'
  ) then
    alter publication supabase_realtime add table public.invitations;
  end if;

  -- group_members
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'group_members'
  ) then
    alter publication supabase_realtime add table public.group_members;
  end if;

  -- drinks
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'drinks'
  ) then
    alter publication supabase_realtime add table public.drinks;
  end if;

  -- groups
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'groups'
  ) then
    alter publication supabase_realtime add table public.groups;
  end if;
end;
$$;

commit;
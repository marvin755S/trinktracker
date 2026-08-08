-- ============================================================
-- Realtime für relevante Tabellen aktivieren
-- Datum: 08.08.2026
--
-- Aktiviert Supabase Realtime für:
--   - invitations  (neue Einladungen live anzeigen)
--   - group_members (Mitgliederänderungen live)
--   - drinks        (Leaderboard live aktualisieren)
--   - groups        (neue Gruppen live)
-- ============================================================

begin;

-- Realtime für Tabellen aktivieren (idempotent)
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
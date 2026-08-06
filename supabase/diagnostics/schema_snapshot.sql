-- Read-only schema snapshot for troubleshooting. It does not expose rows,
-- passwords, keys, or other application data.

select
  'columns' as section,
  table_name as item,
  column_name || ' : ' || data_type || coalesce(' (' || udt_name || ')', '') as detail
from information_schema.columns
where table_schema = 'public'
  and table_name in ('groups', 'group_members', 'profiles', 'categories', 'drinks', 'events', 'event_members')

union all

select
  'constraints' as section,
  tc.table_name as item,
  tc.constraint_name || ' : ' || tc.constraint_type || coalesce(' -> ' || ccu.table_name, '') as detail
from information_schema.table_constraints tc
left join information_schema.constraint_column_usage ccu
  on ccu.constraint_schema = tc.constraint_schema
  and ccu.constraint_name = tc.constraint_name
where tc.table_schema = 'public'
  and tc.table_name in ('groups', 'group_members', 'profiles', 'categories', 'drinks', 'events', 'event_members')

union all

select
  'policies' as section,
  tablename as item,
  policyname || ' [' || cmd || ']: ' || coalesce(qual, '') || coalesce(' / CHECK ' || with_check, '') as detail
from pg_policies
where schemaname = 'public'
  and tablename in ('groups', 'group_members', 'profiles', 'categories', 'drinks', 'events', 'event_members')

union all

select
  'functions' as section,
  p.proname as item,
  pg_get_function_identity_arguments(p.oid) || E'\n' || pg_get_functiondef(p.oid) as detail
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_group_member', 'validate_event_member', 'validate_drink_event')

order by section, item, detail;

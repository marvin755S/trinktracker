-- ============================================================
-- Konsolidierte Fix-Migration
-- Datum: 07.08.2026
--
-- 1. invitations-Tabelle anlegen (war nie in der DB ausgeführt)
-- 2. UNIQUE-Constraint auf group_members(group_id, user_id)
-- 3. is_admin() Funktion anlegen
-- 4. FK-Constraint Tippfehler korrigieren (drinks_categoy_id_fkey)
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. invitations-Tabelle + RLS
-- ------------------------------------------------------------
create extension if not exists pgcrypto;

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  group_id bigint not null references public.groups(id) on delete cascade,
  invited_email text not null,
  invited_user_id uuid,
  status text default 'pending',
  created_by uuid,
  created_at timestamptz default now()
);

create index if not exists idx_invitations_invited_email on public.invitations (invited_email);
create index if not exists idx_invitations_group_id on public.invitations (group_id);

alter table public.invitations enable row level security;

-- Policies nur anlegen, wenn nicht vorhanden (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'invitations' and policyname = 'Invitations: insert own'
  ) then
    create policy "Invitations: insert own" on public.invitations
      for insert to authenticated
      with check (created_by = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'invitations' and policyname = 'Invitations: select owner or creator or invited'
  ) then
    create policy "Invitations: select owner or creator or invited" on public.invitations
      for select to authenticated
      using (
        created_by = auth.uid()
        or invited_user_id::text = auth.uid()::text
        or (
          current_setting('jwt.claims.email', true) is not null
          and invited_email = current_setting('jwt.claims.email', true)
        )
        or exists (
          select 1 from public.group_members gm
          where gm.group_id = public.invitations.group_id
            and gm.user_id::text = auth.uid()::text
            and gm.role = 'owner'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'invitations' and policyname = 'Invitations: update by owner or creator'
  ) then
    create policy "Invitations: update by owner or creator" on public.invitations
      for update to authenticated
      using (
        created_by = auth.uid()
        or exists (
          select 1 from public.group_members gm
          where gm.group_id = public.invitations.group_id
            and gm.user_id::text = auth.uid()::text
            and gm.role = 'owner'
        )
      )
      with check (
        created_by = auth.uid()
        or exists (
          select 1 from public.group_members gm
          where gm.group_id = public.invitations.group_id
            and gm.user_id::text = auth.uid()::text
            and gm.role = 'owner'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'invitations' and policyname = 'Invitations: delete by owner or creator or invited'
  ) then
    create policy "Invitations: delete by owner or creator or invited" on public.invitations
      for delete to authenticated
      using (
        created_by = auth.uid()
        or invited_user_id::text = auth.uid()::text
        or (
          current_setting('jwt.claims.email', true) is not null
          and invited_email = current_setting('jwt.claims.email', true)
        )
        or exists (
          select 1 from public.group_members gm
          where gm.group_id = public.invitations.group_id
            and gm.user_id::text = auth.uid()::text
            and gm.role = 'owner'
        )
      );
  end if;
end;
$$;

-- ------------------------------------------------------------
-- 2. UNIQUE-Constraint auf group_members(group_id, user_id)
--    Vorher Duplikate entfernen, damit die Constraint greifen kann
-- ------------------------------------------------------------
-- Duplikate entfernen (falls vorhanden)
delete from public.group_members a
using public.group_members b
where a.group_id = b.group_id
  and a.user_id = b.user_id
  and a.id > b.id;

-- UNIQUE-Constraint nur hinzufügen, wenn nicht vorhanden
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'group_members_group_user_key'
      and connamespace = 'public'::regnamespace
  ) then
    alter table public.group_members
      add constraint group_members_group_user_key unique (group_id, user_id);
  end if;
end;
$$;

-- ------------------------------------------------------------
-- 3. is_admin() Funktion anlegen (wird von RLS-Policies genutzt)
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- ------------------------------------------------------------
-- 4. FK-Constraint Tippfehler korrigieren
--    drinks_categoy_id_fkey -> drinks_category_id_fkey
-- ------------------------------------------------------------
alter table public.drinks
  drop constraint if exists drinks_categoy_id_fkey;

alter table public.drinks
  add constraint drinks_category_id_fkey
  foreign key (category_id) references public.categories(id);

commit;
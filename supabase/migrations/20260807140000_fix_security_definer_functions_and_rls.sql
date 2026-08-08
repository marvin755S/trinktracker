-- ============================================================
-- Fix security definer functions + ensure RLS policies exist
-- Datum: 08.08.2026
--
-- Problem:
--   is_group_member(), is_admin(), update_own_profile_name(),
--   update_own_avatar_path() verwenden `set search_path = public`
--   und rufen `auth.uid()` ohne Schema-Qualifier auf.
--   Da `auth` nicht im search_path liegt, schlagen ALLE RLS-Policies
--   und Funktionsaufrufe fehl. Neue Nutzer können deshalb keine
--   Gruppen erstellen, keine Einladungen sehen und ihren Namen
--   nicht ändern.
--
-- Fix:
--   1. search_path um `auth` erweitern
--   2. Zusätzlich RLS-Policies für groups, group_members und
--      profiles idempotent sicherstellen (falls im Dashboard
--      nicht angelegt).
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. is_group_member() reparieren
-- ------------------------------------------------------------
create or replace function public.is_group_member(group_id bigint)
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select exists (
    select 1 from public.group_members gm
    where gm.group_id = $1 and gm.user_id = auth.uid()
  );
$$;

grant execute on function public.is_group_member(bigint) to authenticated;

-- ------------------------------------------------------------
-- 2. is_admin() reparieren
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- ------------------------------------------------------------
-- 3. update_own_profile_name() reparieren
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

  update public.profiles set name = trim(profile_name) where id = auth.uid();
end;
$$;

grant execute on function public.update_own_profile_name(text) to authenticated;

-- ------------------------------------------------------------
-- 4. update_own_avatar_path() reparieren
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

  update public.profiles set avatar_path = new_avatar_path where id = auth.uid();
end;
$$;

grant execute on function public.update_own_avatar_path(text) to authenticated;

-- ------------------------------------------------------------
-- 5. validate_event_member() / validate_drink_event() ebenfalls fixen
-- ------------------------------------------------------------
create or replace function public.validate_event_member()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not exists (
    select 1
    from public.events e
    join public.group_members gm on gm.group_id = e.group_id
    where e.id = new.event_id and gm.user_id = new.user_id
  ) then
    raise exception 'Event members must be members of the event group';
  end if;
  return new;
end;
$$;

create or replace function public.validate_drink_event()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.event_id is not null and not exists (
    select 1 from public.event_members em
    where em.event_id = new.event_id and em.user_id = new.user_id
  ) then
    raise exception 'The drink owner must be a member of the event';
  end if;
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 6. RLS auf groups/group_members/profiles sicherstellen
-- ------------------------------------------------------------
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.profiles enable row level security;

do $$
begin
  -- groups
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'groups' and policyname = 'Users can create groups'
  ) then
    create policy "Users can create groups" on public.groups
      for insert to authenticated
      with check (owner_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'groups' and policyname = 'Users can view groups'
  ) then
    create policy "Users can view groups" on public.groups
      for select to authenticated
      using (
        auth.uid() = owner_id
        or public.is_group_member(id)
        or exists (
          select 1 from public.invitations inv
          where inv.group_id = public.groups.id
            and (
              inv.invited_user_id = auth.uid()
              or (
                current_setting('jwt.claims.email', true) is not null
                and inv.invited_email = current_setting('jwt.claims.email', true)
              )
            )
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'groups' and policyname = 'Group owners can delete groups'
  ) then
    create policy "Group owners can delete groups" on public.groups
      for delete to authenticated
      using (owner_id = auth.uid());
  end if;

  -- group_members
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'group_members' and policyname = 'Group members can view fellow members'
  ) then
    create policy "Group members can view fellow members" on public.group_members
      for select to authenticated
      using (public.is_group_member(group_id));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'group_members' and policyname = 'Users can join groups or owners can add members'
  ) then
    create policy "Users can join groups or owners can add members" on public.group_members
      for insert to authenticated
      with check (
        user_id = auth.uid()
        or exists (
          select 1 from public.group_members gm
          where gm.group_id = group_members.group_id
            and gm.user_id = auth.uid()
            and gm.role = 'owner'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'group_members' and policyname = 'Group owners can update members'
  ) then
    create policy "Group owners can update members" on public.group_members
      for update to authenticated
      using (
        exists (
          select 1 from public.group_members gm
          where gm.group_id = group_members.group_id
            and gm.user_id = auth.uid()
            and gm.role = 'owner'
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'group_members' and policyname = 'Group owners can remove members'
  ) then
    create policy "Group owners can remove members" on public.group_members
      for delete to authenticated
      using (
        exists (
          select 1 from public.group_members gm
          where gm.group_id = group_members.group_id
            and gm.user_id = auth.uid()
            and gm.role = 'owner'
        )
      );
  end if;

  -- profiles
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users can insert their own profile'
  ) then
    create policy "Users can insert their own profile" on public.profiles
      for insert to authenticated
      with check (id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'Profiles: authenticated select'
  ) then
    create policy "Profiles: authenticated select" on public.profiles
      for select to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users can update their own profile'
  ) then
    create policy "Users can update their own profile" on public.profiles
      for update to authenticated
      using (id = auth.uid())
      with check (id = auth.uid());
  end if;
end;
$$;

commit;
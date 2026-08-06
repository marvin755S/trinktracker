-- Events are optional group contexts (for example "Sommerurlaub 2026").
-- A drink always belongs to a group and may additionally belong to one event.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

create table public.event_members (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (event_id, user_id)
);

alter table public.drinks
  add column event_id uuid references public.events(id) on delete set null;

-- An event membership is only valid if the person is already a group member.
create or replace function public.validate_event_member()
returns trigger
language plpgsql
security definer
set search_path = public
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

create trigger event_member_must_belong_to_group
before insert or update on public.event_members
for each row execute function public.validate_event_member();

-- Prevent linking a drink to an event from another group.
create or replace function public.validate_drink_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.event_id is not null and not exists (
    select 1 from public.events e
    where e.id = new.event_id and e.group_id = new.group_id
  ) then
    raise exception 'The event must belong to the same group as the drink';
  end if;
  return new;
end;
$$;

create trigger drink_event_must_belong_to_group
before insert or update on public.drinks
for each row execute function public.validate_drink_event();

-- RLS: members may view the other members of their group, which enables the
-- member count and member names in the group view.
create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = target_group_id and user_id = auth.uid()
  );
$$;

grant execute on function public.is_group_member(uuid) to authenticated;

create policy "Group members can view fellow members"
on public.group_members for select to authenticated
using (public.is_group_member(group_id));

create policy "Group members can view fellow member profiles"
on public.profiles for select to authenticated
using (
  exists (
    select 1 from public.group_members gm
    where gm.user_id = profiles.id and public.is_group_member(gm.group_id)
  )
);

alter table public.events enable row level security;
alter table public.event_members enable row level security;

create policy "Group members can view events"
on public.events for select to authenticated
using (public.is_group_member(group_id));

create policy "Group members can create events"
on public.events for insert to authenticated
with check (public.is_group_member(group_id));

create policy "Group owners can update events"
on public.events for update to authenticated
using (exists (
  select 1 from public.group_members gm
  where gm.group_id = events.group_id and gm.user_id = auth.uid() and gm.role = 'owner'
));

create policy "Group owners can delete events"
on public.events for delete to authenticated
using (exists (
  select 1 from public.group_members gm
  where gm.group_id = events.group_id and gm.user_id = auth.uid() and gm.role = 'owner'
));

create policy "Group members can view event members"
on public.event_members for select to authenticated
using (exists (
  select 1 from public.events e where e.id = event_members.event_id
  and public.is_group_member(e.group_id)
));

create policy "Group owners can manage event members"
on public.event_members for all to authenticated
using (exists (
  select 1 from public.events e
  join public.group_members gm on gm.group_id = e.group_id
  where e.id = event_members.event_id and gm.user_id = auth.uid() and gm.role = 'owner'
))
with check (exists (
  select 1 from public.events e
  join public.group_members gm on gm.group_id = e.group_id
  where e.id = event_members.event_id and gm.user_id = auth.uid() and gm.role = 'owner'
));

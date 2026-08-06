-- Categories and drinks belong to a person. Groups only aggregate the drinks
-- of their members, so the same drink can contribute to several groups.

begin;

do $$
declare
  policy_name text;
begin
  for policy_name in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'categories'
  loop
    execute format('drop policy if exists %I on public.categories', policy_name);
  end loop;
end;
$$;

alter table public.categories add column user_id uuid;

-- Existing categories become categories of the group owner.
update public.categories c
set user_id = g.owner_id
from public.groups g
where g.id = c.group_id;

alter table public.categories
  alter column user_id set not null,
  add constraint categories_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade,
  drop column group_id,
  add constraint categories_user_id_name_key unique (user_id, name);

-- Correct the original column typo before implementing the drink UI.
alter table public.drinks rename column categoy_id to category_id;

create or replace function public.validate_drink_category()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.categories c
    where c.id = new.category_id and c.user_id = new.user_id
  ) then
    raise exception 'The category must belong to the drink owner';
  end if;
  return new;
end;
$$;

create trigger drink_category_must_belong_to_owner
before insert or update on public.drinks
for each row execute function public.validate_drink_category();

create policy "Users can view their own categories"
on public.categories for select to authenticated
using (user_id = auth.uid());

create policy "Users can create their own categories"
on public.categories for insert to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own categories"
on public.categories for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Users can delete their own categories"
on public.categories for delete to authenticated
using (user_id = auth.uid());

-- Names of categories and drinks are visible where group statistics need them.
create policy "Group members can view fellow member categories"
on public.categories for select to authenticated
using (exists (
  select 1 from public.group_members gm
  where gm.user_id = categories.user_id and public.is_group_member(gm.group_id)
));

create policy "Group members can view fellow member drinks"
on public.drinks for select to authenticated
using (exists (
  select 1 from public.group_members gm
  where gm.user_id = drinks.user_id and public.is_group_member(gm.group_id)
));

-- Events are managed by the group owner, who can add the first event member.
drop policy if exists "Group members can create events" on public.events;

create policy "Group owners can create events"
on public.events for insert to authenticated
with check (exists (
  select 1 from public.group_members gm
  where gm.group_id = events.group_id and gm.user_id = auth.uid() and gm.role = 'owner'
));

commit;

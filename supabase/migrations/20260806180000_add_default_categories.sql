-- Default categories are shared by everyone. Personal categories remain
-- possible and belong to exactly one user.

begin;

alter table public.categories
  alter column user_id drop not null;

create unique index categories_default_name_key
on public.categories (name)
where user_id is null;

insert into public.categories (name, user_id)
values
  ('BIR', null),
  ('Äppler', null),
  ('Longdrink', null),
  ('Wein', null),
  ('Shot', null)
on conflict do nothing;

create or replace function public.validate_drink_category()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.categories c
    where c.id = new.category_id
      and (c.user_id is null or c.user_id = new.user_id)
  ) then
    raise exception 'The category must be a default category or belong to the drink owner';
  end if;
  return new;
end;
$$;

create policy "Users can view default categories"
on public.categories for select to authenticated
using (user_id is null);

commit;

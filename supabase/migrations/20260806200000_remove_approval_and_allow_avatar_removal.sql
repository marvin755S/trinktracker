begin;

update public.profiles set approved = true where approved = false;

create or replace function public.update_own_avatar_path(new_avatar_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if new_avatar_path is not null
    and new_avatar_path <> (auth.uid()::text || '/avatar') then
    raise exception 'Invalid avatar path';
  end if;

  update public.profiles set avatar_path = new_avatar_path where id = auth.uid();
end;
$$;

commit;

begin;

alter table public.profiles add column avatar_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "Users can view their own avatars"
on storage.objects for select to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can upload their own avatars"
on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own avatars"
on storage.objects for update to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own avatars"
on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.update_own_profile_name(profile_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if char_length(trim(profile_name)) < 1 or char_length(trim(profile_name)) > 80 then
    raise exception 'Profile name must be between 1 and 80 characters';
  end if;

  update public.profiles set name = trim(profile_name) where id = auth.uid();
end;
$$;

create or replace function public.update_own_avatar_path(new_avatar_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if new_avatar_path <> (auth.uid()::text || '/avatar') then
    raise exception 'Invalid avatar path';
  end if;

  update public.profiles set avatar_path = new_avatar_path where id = auth.uid();
end;
$$;

grant execute on function public.update_own_profile_name(text) to authenticated;
grant execute on function public.update_own_avatar_path(text) to authenticated;

commit;

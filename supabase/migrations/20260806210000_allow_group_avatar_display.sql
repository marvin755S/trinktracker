begin;

create policy "Group members can view fellow member avatars"
on storage.objects for select to authenticated
using (
  bucket_id = 'avatars'
  and exists (
    select 1
    from public.group_members gm
    where gm.user_id::text = (storage.foldername(name))[1]
      and public.is_group_member(gm.group_id)
  )
);

commit;

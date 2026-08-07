-- Eingeladene User (per invitations) sollen den Gruppennamen sehen können,
-- auch wenn sie noch keine Gruppenmitglieder sind.

begin;

-- Bestehende SELECT-Policy für groups erweitern:
-- Owner, Gruppenmitglieder ODER eingeladene User (per invitations)
drop policy if exists "Users can view groups" on public.groups;

create policy "Users can view groups"
on public.groups for select to authenticated
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

commit;
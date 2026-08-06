begin;

-- Ensure pgcrypto for gen_random_uuid() exists
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

-- Optional: an index to quickly find invitations for a user/email
create index if not exists idx_invitations_invited_email on public.invitations (invited_email);
create index if not exists idx_invitations_group_id on public.invitations (group_id);

commit;

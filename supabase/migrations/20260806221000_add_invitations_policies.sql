begin;

-- Enable row level security for invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert invitations where they set created_by = auth.uid()
CREATE POLICY "Invitations: insert own" ON public.invitations
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Allow creators, invited users (by user id or email), or group owners to select invitations
CREATE POLICY "Invitations: select owner or creator or invited" ON public.invitations
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR invited_user_id::text = auth.uid()::text
    OR (
      current_setting('jwt.claims.email', true) IS NOT NULL
      AND invited_email = current_setting('jwt.claims.email', true)
    )
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = public.invitations.group_id
        AND gm.user_id::text = auth.uid()::text
        AND gm.role = 'owner'
    )
  );

-- Allow creators or group owners to UPDATE invitations
CREATE POLICY "Invitations: update by owner or creator" ON public.invitations
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = public.invitations.group_id
        AND gm.user_id::text = auth.uid()::text
        AND gm.role = 'owner'
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = public.invitations.group_id
        AND gm.user_id::text = auth.uid()::text
        AND gm.role = 'owner'
    )
  );

-- Allow creators or group owners to DELETE invitations
CREATE POLICY "Invitations: delete by owner or creator" ON public.invitations
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = public.invitations.group_id
        AND gm.user_id::text = auth.uid()::text
        AND gm.role = 'owner'
    )
  );

commit;

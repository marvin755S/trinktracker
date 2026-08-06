begin;

-- Update SELECT policy for invitations: drop old policy if present and create new one
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Drop any previous select policies with known names
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invitations' AND policyname = 'Invitations: select owner or creator') THEN
    EXECUTE 'DROP POLICY "Invitations: select owner or creator" ON public.invitations';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invitations' AND policyname = 'Invitations: select owner or creator or invited') THEN
    EXECUTE 'DROP POLICY "Invitations: select owner or creator or invited" ON public.invitations';
  END IF;
END
$$;

-- Create updated SELECT policy that allows creators, invited users (by user id or JWT email), or group owners
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

commit;

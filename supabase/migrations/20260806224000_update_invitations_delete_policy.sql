begin;

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'invitations'
      AND policyname = 'Invitations: delete by owner or creator'
  ) THEN
    EXECUTE 'DROP POLICY "Invitations: delete by owner or creator" ON public.invitations';
  END IF;
END
$$;

CREATE POLICY "Invitations: delete by owner or creator or invited" ON public.invitations
  FOR DELETE TO authenticated
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

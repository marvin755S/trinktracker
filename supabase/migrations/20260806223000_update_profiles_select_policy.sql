begin;

-- Update profile select policy so authenticated users can search users for invitations
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Group members can view fellow member profiles'
  ) THEN
    EXECUTE 'DROP POLICY "Group members can view fellow member profiles" ON public.profiles';
  END IF;
END
$$;

CREATE POLICY "Profiles: authenticated select" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

commit;

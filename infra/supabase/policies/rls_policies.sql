-- rls_policies.sql
-- Example RLS policies to apply after enabling RLS on tables

-- Enable RLS
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- users_profile: members can read their own profile, admins can read all
CREATE POLICY "users_profile_select" ON public.users_profile
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth.uid() = auth_uid::text OR
    auth.role() = 'admin'
  );

CREATE POLICY "users_profile_update_self" ON public.users_profile
  FOR UPDATE USING (auth.uid() = auth_uid::text) WITH CHECK (auth.uid() = auth_uid::text);

-- memberships: members can read their memberships
CREATE POLICY "memberships_select" ON public.memberships
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM public.users_profile u WHERE u.id = memberships.user_id AND u.auth_uid::text = auth.uid())
  );

-- checkins: reception/admin can insert; members cannot insert checkins for themselves
CREATE POLICY "checkins_insert_staff" ON public.checkins
  FOR INSERT WITH CHECK (auth.role() IN ('reception','admin') OR auth.role() = 'service_role');

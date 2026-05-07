
INSERT INTO public.user_roles (user_id, role)
VALUES ('8fb68c1b-c42f-42fa-ba10-aa28a0403fb6', 'super_admin'::public.app_role)
ON CONFLICT DO NOTHING;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coach_id uuid;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coach_name text;

CREATE OR REPLACE FUNCTION public.set_user_role(_target uuid, _role public.app_role)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _caller uuid := auth.uid();
BEGIN
  IF _caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF public.has_role(_caller,'super_admin') THEN
    NULL;
  ELSIF public.has_role(_caller,'admin') AND _role IN ('coach','member') THEN
    NULL;
  ELSE
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _target;
  INSERT INTO public.user_roles (user_id, role) VALUES (_target, _role);
END $$;

DROP POLICY IF EXISTS "super admin delete profile" ON public.profiles;
CREATE POLICY "super admin delete profile" ON public.profiles
  FOR DELETE USING (public.has_role(auth.uid(),'super_admin'));

DROP POLICY IF EXISTS "self read profile" ON public.profiles;
DROP POLICY IF EXISTS "read profiles" ON public.profiles;
CREATE POLICY "read profiles" ON public.profiles FOR SELECT USING (
  auth.uid() = id
  OR public.has_role(auth.uid(),'super_admin')
  OR public.has_role(auth.uid(),'admin')
  OR (public.has_role(auth.uid(),'coach') AND coach_id = auth.uid())
);

DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "view roles" ON public.user_roles;
CREATE POLICY "view roles" ON public.user_roles FOR SELECT USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(),'admin')
  OR public.has_role(auth.uid(),'super_admin')
);

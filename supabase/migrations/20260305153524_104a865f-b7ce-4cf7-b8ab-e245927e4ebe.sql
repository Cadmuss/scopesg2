
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. RLS on user_roles: only admins/editors can view
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 5. Update knowledge_base policies: remove permissive ones, add editor-only
DROP POLICY IF EXISTS "Authenticated users can insert" ON public.knowledge_base;
DROP POLICY IF EXISTS "Authenticated users can update" ON public.knowledge_base;
DROP POLICY IF EXISTS "Authenticated users can delete" ON public.knowledge_base;

CREATE POLICY "Editors can insert knowledge" ON public.knowledge_base
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Editors can update knowledge" ON public.knowledge_base
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Editors can delete knowledge" ON public.knowledge_base
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'admin'));

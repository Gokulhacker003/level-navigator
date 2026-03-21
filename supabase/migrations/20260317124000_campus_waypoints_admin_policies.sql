-- Enable RLS and policies for campus_waypoints so admins can maintain it.
ALTER TABLE public.campus_waypoints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Campus waypoints are publicly readable" ON public.campus_waypoints;
CREATE POLICY "Campus waypoints are publicly readable"
ON public.campus_waypoints
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can insert campus waypoints" ON public.campus_waypoints;
CREATE POLICY "Admins can insert campus waypoints"
ON public.campus_waypoints
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update campus waypoints" ON public.campus_waypoints;
CREATE POLICY "Admins can update campus waypoints"
ON public.campus_waypoints
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete campus waypoints" ON public.campus_waypoints;
CREATE POLICY "Admins can delete campus waypoints"
ON public.campus_waypoints
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

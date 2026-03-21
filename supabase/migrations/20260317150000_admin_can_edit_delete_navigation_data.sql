-- Ensure admin users can add, edit, and delete all navigation data tables.

DO $$
BEGIN
	IF to_regclass('public.rooms') IS NOT NULL THEN
		EXECUTE 'DROP POLICY IF EXISTS "Admins can insert rooms" ON public.rooms';
		EXECUTE 'DROP POLICY IF EXISTS "Admins can update rooms" ON public.rooms';
		EXECUTE 'DROP POLICY IF EXISTS "Admins can delete rooms" ON public.rooms';

		EXECUTE 'CREATE POLICY "Admins can insert rooms" ON public.rooms FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), ''admin''))';
		EXECUTE 'CREATE POLICY "Admins can update rooms" ON public.rooms FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))';
		EXECUTE 'CREATE POLICY "Admins can delete rooms" ON public.rooms FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''admin''))';
	END IF;
END
$$;

DO $$
BEGIN
	IF to_regclass('public.waypoints') IS NOT NULL THEN
		EXECUTE 'DROP POLICY IF EXISTS "Admins can insert waypoints" ON public.waypoints';
		EXECUTE 'DROP POLICY IF EXISTS "Admins can update waypoints" ON public.waypoints';
		EXECUTE 'DROP POLICY IF EXISTS "Admins can delete waypoints" ON public.waypoints';

		EXECUTE 'CREATE POLICY "Admins can insert waypoints" ON public.waypoints FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), ''admin''))';
		EXECUTE 'CREATE POLICY "Admins can update waypoints" ON public.waypoints FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))';
		EXECUTE 'CREATE POLICY "Admins can delete waypoints" ON public.waypoints FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''admin''))';
	END IF;
END
$$;

DO $$
BEGIN
	IF to_regclass('public.graph_edges') IS NOT NULL THEN
		EXECUTE 'DROP POLICY IF EXISTS "Admins can insert edges" ON public.graph_edges';
		EXECUTE 'DROP POLICY IF EXISTS "Admins can update edges" ON public.graph_edges';
		EXECUTE 'DROP POLICY IF EXISTS "Admins can delete edges" ON public.graph_edges';

		EXECUTE 'CREATE POLICY "Admins can insert edges" ON public.graph_edges FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), ''admin''))';
		EXECUTE 'CREATE POLICY "Admins can update edges" ON public.graph_edges FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))';
		EXECUTE 'CREATE POLICY "Admins can delete edges" ON public.graph_edges FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''admin''))';
	END IF;
END
$$;

DO $$
BEGIN
	IF to_regclass('public.floor_maps') IS NOT NULL THEN
		EXECUTE 'DROP POLICY IF EXISTS "Admins can insert floor maps" ON public.floor_maps';
		EXECUTE 'DROP POLICY IF EXISTS "Admins can update floor maps" ON public.floor_maps';
		EXECUTE 'DROP POLICY IF EXISTS "Admins can delete floor maps" ON public.floor_maps';

		EXECUTE 'CREATE POLICY "Admins can insert floor maps" ON public.floor_maps FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), ''admin''))';
		EXECUTE 'CREATE POLICY "Admins can update floor maps" ON public.floor_maps FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))';
		EXECUTE 'CREATE POLICY "Admins can delete floor maps" ON public.floor_maps FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''admin''))';
	END IF;
END
$$;

DO $$
BEGIN
	IF to_regclass('public.campus_waypoints') IS NOT NULL THEN
		EXECUTE 'DROP POLICY IF EXISTS "Admins can insert campus waypoints" ON public.campus_waypoints';
		EXECUTE 'DROP POLICY IF EXISTS "Admins can update campus waypoints" ON public.campus_waypoints';
		EXECUTE 'DROP POLICY IF EXISTS "Admins can delete campus waypoints" ON public.campus_waypoints';

		EXECUTE 'CREATE POLICY "Admins can insert campus waypoints" ON public.campus_waypoints FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), ''admin''))';
		EXECUTE 'CREATE POLICY "Admins can update campus waypoints" ON public.campus_waypoints FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))';
		EXECUTE 'CREATE POLICY "Admins can delete campus waypoints" ON public.campus_waypoints FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''admin''))';
	END IF;
END
$$;

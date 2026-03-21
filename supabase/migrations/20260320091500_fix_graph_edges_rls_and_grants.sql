-- Ensure graph_edges has the expected RLS policies and table privileges for admin writes.

ALTER TABLE public.graph_edges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Graph edges are publicly readable" ON public.graph_edges;
DROP POLICY IF EXISTS "Admins can insert edges" ON public.graph_edges;
DROP POLICY IF EXISTS "Admins can update edges" ON public.graph_edges;
DROP POLICY IF EXISTS "Admins can delete edges" ON public.graph_edges;

CREATE POLICY "Graph edges are publicly readable"
ON public.graph_edges
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert edges"
ON public.graph_edges
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update edges"
ON public.graph_edges
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete edges"
ON public.graph_edges
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Make table-level privileges explicit so PostgREST can evaluate RLS instead of failing early.
GRANT SELECT ON TABLE public.graph_edges TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.graph_edges TO authenticated;

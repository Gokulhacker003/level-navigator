-- Redesign graph_edges to reference waypoint primary keys for reliable routing.

ALTER TABLE public.graph_edges
  ADD COLUMN IF NOT EXISTS from_waypoint_id UUID,
  ADD COLUMN IF NOT EXISTS to_waypoint_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'graph_edges_from_waypoint_id_fkey'
  ) THEN
    ALTER TABLE public.graph_edges
      ADD CONSTRAINT graph_edges_from_waypoint_id_fkey
      FOREIGN KEY (from_waypoint_id)
      REFERENCES public.waypoints(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'graph_edges_to_waypoint_id_fkey'
  ) THEN
    ALTER TABLE public.graph_edges
      ADD CONSTRAINT graph_edges_to_waypoint_id_fkey
      FOREIGN KEY (to_waypoint_id)
      REFERENCES public.waypoints(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Backfill FK columns from legacy text node names when possible.
WITH from_match AS (
  SELECT
    ge.id AS edge_id,
    wp.id AS waypoint_id,
    ROW_NUMBER() OVER (
      PARTITION BY ge.id
      ORDER BY CASE WHEN ge.floor IS NOT NULL AND wp.floor = ge.floor THEN 0 ELSE 1 END, wp.name
    ) AS rn
  FROM public.graph_edges ge
  JOIN public.waypoints wp
    ON wp.name = ge.from_node
   AND (ge.floor IS NULL OR wp.floor = ge.floor)
),
to_match AS (
  SELECT
    ge.id AS edge_id,
    wp.id AS waypoint_id,
    ROW_NUMBER() OVER (
      PARTITION BY ge.id
      ORDER BY CASE WHEN ge.floor IS NOT NULL AND wp.floor = ge.floor THEN 0 ELSE 1 END, wp.name
    ) AS rn
  FROM public.graph_edges ge
  JOIN public.waypoints wp
    ON wp.name = ge.to_node
   AND (ge.floor IS NULL OR wp.floor = ge.floor)
)
UPDATE public.graph_edges ge
SET from_waypoint_id = fm.waypoint_id,
    to_waypoint_id = tm.waypoint_id
FROM from_match fm
JOIN to_match tm ON tm.edge_id = fm.edge_id
WHERE ge.id = fm.edge_id
  AND fm.rn = 1
  AND tm.rn = 1
  AND (ge.from_waypoint_id IS NULL OR ge.to_waypoint_id IS NULL);

CREATE INDEX IF NOT EXISTS graph_edges_from_waypoint_id_idx ON public.graph_edges(from_waypoint_id);
CREATE INDEX IF NOT EXISTS graph_edges_to_waypoint_id_idx ON public.graph_edges(to_waypoint_id);

-- Replace old uniqueness (from_node, to_node) so same node names can exist per floor.
ALTER TABLE public.graph_edges DROP CONSTRAINT IF EXISTS graph_edges_from_node_to_node_key;

CREATE UNIQUE INDEX IF NOT EXISTS graph_edges_unique_legacy_pair_floor_idx
ON public.graph_edges(from_node, to_node, COALESCE(floor::text, 'NONE'));

CREATE UNIQUE INDEX IF NOT EXISTS graph_edges_unique_fk_pair_floor_idx
ON public.graph_edges(
  LEAST(from_waypoint_id, to_waypoint_id),
  GREATEST(from_waypoint_id, to_waypoint_id),
  COALESCE(floor::text, 'NONE')
)
WHERE from_waypoint_id IS NOT NULL AND to_waypoint_id IS NOT NULL;

-- Prevent self-loops for FK-based edges.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'graph_edges_distinct_waypoints_check'
  ) THEN
    ALTER TABLE public.graph_edges
      ADD CONSTRAINT graph_edges_distinct_waypoints_check
      CHECK (from_waypoint_id IS NULL OR to_waypoint_id IS NULL OR from_waypoint_id <> to_waypoint_id);
  END IF;
END $$;

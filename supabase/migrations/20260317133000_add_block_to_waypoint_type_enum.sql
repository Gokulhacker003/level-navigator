-- Add 'block' to waypoint_type enum for block-only waypoints.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'waypoint_type'
      AND n.nspname = 'public'
      AND e.enumlabel = 'block'
  ) THEN
    ALTER TYPE public.waypoint_type ADD VALUE 'block';
  END IF;
END $$;

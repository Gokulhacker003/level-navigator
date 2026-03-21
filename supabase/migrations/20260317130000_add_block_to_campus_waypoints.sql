-- Add block type to campus_waypoints and backfill existing rows.
ALTER TABLE public.campus_waypoints
ADD COLUMN IF NOT EXISTS block TEXT NOT NULL DEFAULT 'A';

-- Optional normalization for existing records.
UPDATE public.campus_waypoints
SET block = UPPER(TRIM(block))
WHERE block IS NOT NULL;

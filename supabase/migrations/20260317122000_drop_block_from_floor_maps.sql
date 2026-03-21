-- Remove block from floor_maps now that each floor has a single map.

-- Ensure floor-only uniqueness exists before removing block.
ALTER TABLE public.floor_maps DROP CONSTRAINT IF EXISTS floor_maps_floor_block_key;
ALTER TABLE public.floor_maps DROP CONSTRAINT IF EXISTS floor_maps_floor_key;
ALTER TABLE public.floor_maps ADD CONSTRAINT floor_maps_floor_key UNIQUE (floor);

-- Drop the obsolete column.
ALTER TABLE public.floor_maps DROP COLUMN IF EXISTS block;

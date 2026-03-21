-- Normalize floor_maps to one record per floor (block is no longer used).

-- Keep the latest uploaded map per floor and remove older duplicates.
DELETE FROM public.floor_maps fm
USING public.floor_maps newer
WHERE fm.floor = newer.floor
  AND fm.id <> newer.id
  AND COALESCE(fm.uploaded_at, fm.updated_at) < COALESCE(newer.uploaded_at, newer.updated_at);

-- In case of ties, keep one row deterministically.
DELETE FROM public.floor_maps fm
USING public.floor_maps same_time
WHERE fm.floor = same_time.floor
  AND fm.id < same_time.id
  AND COALESCE(fm.uploaded_at, fm.updated_at) = COALESCE(same_time.uploaded_at, same_time.updated_at);

-- Force canonical block value for backward compatibility.
UPDATE public.floor_maps
SET block = 'A'
WHERE block IS DISTINCT FROM 'A';

-- Replace floor+block uniqueness with floor-only uniqueness.
ALTER TABLE public.floor_maps DROP CONSTRAINT IF EXISTS floor_maps_floor_block_key;
ALTER TABLE public.floor_maps ADD CONSTRAINT floor_maps_floor_key UNIQUE (floor);

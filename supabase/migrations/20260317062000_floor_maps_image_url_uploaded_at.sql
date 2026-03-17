ALTER TABLE public.floor_maps
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.floor_maps
SET image_url = COALESCE(image_url, blueprint_url)
WHERE image_url IS NULL;

UPDATE public.floor_maps
SET uploaded_at = COALESCE(uploaded_at, created_at)
WHERE uploaded_at IS NULL;

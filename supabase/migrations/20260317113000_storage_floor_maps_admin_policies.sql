-- Ensure a public bucket exists for floor map images.
INSERT INTO storage.buckets (id, name, public)
VALUES ('floor-maps', 'floor-maps', true)
ON CONFLICT (id) DO NOTHING;

-- Allow everyone to read floor map images.
DROP POLICY IF EXISTS "Floor map images are publicly readable" ON storage.objects;
CREATE POLICY "Floor map images are publicly readable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'floor-maps');

-- Allow only admins to upload/update/delete floor map images.
DROP POLICY IF EXISTS "Admins can upload floor map images" ON storage.objects;
CREATE POLICY "Admins can upload floor map images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'floor-maps'
  AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins can update floor map images" ON storage.objects;
CREATE POLICY "Admins can update floor map images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'floor-maps'
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'floor-maps'
  AND public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins can delete floor map images" ON storage.objects;
CREATE POLICY "Admins can delete floor map images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'floor-maps'
  AND public.has_role(auth.uid(), 'admin')
);

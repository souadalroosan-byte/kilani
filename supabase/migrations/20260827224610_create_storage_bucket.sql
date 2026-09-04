/*
# Create storage bucket for ACI JUST images

1. Storage
- Creates a public bucket named `aci-just-images` for storing department images, member profile photos, research project images, event images, and achievement images.
- Public read access so visitors can see uploaded images on the website.
- Only authenticated admins can upload, update, or delete files.
2. Security
- Storage bucket is public for reads (images are displayed on the public website).
- Upload/update/delete restricted to authenticated users (admins).
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('aci-just-images', 'aci-just-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can read images" ON storage.objects;
CREATE POLICY "Public can read images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'aci-just-images');

DROP POLICY IF EXISTS "Admins can upload images" ON storage.objects;
CREATE POLICY "Admins can upload images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'aci-just-images');

DROP POLICY IF EXISTS "Admins can update images" ON storage.objects;
CREATE POLICY "Admins can update images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'aci-just-images')
  WITH CHECK (bucket_id = 'aci-just-images');

DROP POLICY IF EXISTS "Admins can delete images" ON storage.objects;
CREATE POLICY "Admins can delete images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'aci-just-images');
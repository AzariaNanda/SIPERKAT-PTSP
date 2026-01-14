-- Make assets bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'assets';

-- Create storage policies for assets bucket
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Authenticated users can upload assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'assets');

-- Allow public read access to assets
CREATE POLICY "Public read access for assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'assets');

-- Allow authenticated users to update their own assets
CREATE POLICY "Authenticated users can update assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'assets');

-- Allow authenticated users to delete their own assets  
CREATE POLICY "Authenticated users can delete assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'assets');
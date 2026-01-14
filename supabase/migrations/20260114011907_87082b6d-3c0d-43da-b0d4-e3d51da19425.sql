-- Make the assets bucket private
UPDATE storage.buckets SET public = false WHERE id = 'assets';

-- Drop the existing public SELECT policy
DROP POLICY IF EXISTS "Anyone can view asset images" ON storage.objects;

-- Create new policy for authenticated users only
CREATE POLICY "Authenticated users can view asset images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'assets');
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assets',
  'assets',
  true,
  5242880,  
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
  SET public = true,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'];

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can upload assets'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Authenticated users can upload assets"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'assets')
    $p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read access for assets'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Public read access for assets"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'assets')
    $p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can update assets'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Authenticated users can update assets"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'assets')
    $p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authenticated users can delete assets'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Authenticated users can delete assets"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (bucket_id = 'assets')
    $p$;
  END IF;
END $$;

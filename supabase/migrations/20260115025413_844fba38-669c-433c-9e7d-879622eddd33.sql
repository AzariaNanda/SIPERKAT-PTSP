-- 1. Create a view with masked NIP for non-owners
CREATE OR REPLACE VIEW public.data_peminjaman_masked
WITH (security_invoker=on) AS
SELECT 
  id,
  user_id,
  asset_id,
  jenis_asset,
  nama_pemohon,
  -- Mask NIP: show full NIP only to owner or admin
  CASE 
    WHEN auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') THEN nip
    ELSE LEFT(nip, 4) || '****' || RIGHT(nip, 3)
  END AS nip,
  email,
  unit,
  keperluan,
  butuh_supir,
  tgl_mulai,
  tgl_selesai,
  jam_mulai,
  jam_selesai,
  status,
  catatan_admin,
  timestamp,
  created_at,
  updated_at
FROM public.data_peminjaman;

-- 2. Update the handle_new_user trigger to always assign 'user' role for any new registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert user role for all new users
  -- Check if role already exists to avoid duplicates
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Add unique constraint on user_roles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_key'
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 4. Enable realtime for data_peminjaman if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'data_peminjaman'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.data_peminjaman;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;
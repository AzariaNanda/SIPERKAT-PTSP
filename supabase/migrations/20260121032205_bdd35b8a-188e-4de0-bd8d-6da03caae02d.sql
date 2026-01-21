-- Create function to mask NIP (shows first 4 and last 3 digits)
CREATE OR REPLACE FUNCTION public.mask_nip(nip_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN nip_text IS NULL OR length(nip_text) < 7 THEN nip_text
      ELSE left(nip_text, 4) || '****' || right(nip_text, 3)
    END
$$;

-- Drop existing view and recreate with smart masking
DROP VIEW IF EXISTS public.data_peminjaman_masked;

CREATE VIEW public.data_peminjaman_masked
WITH (security_invoker = on)
AS
SELECT
  id,
  user_id,
  asset_id,
  jenis_asset,
  nama_pemohon,
  -- Show full NIP for owner, masked for others
  CASE 
    WHEN user_id = auth.uid() THEN nip
    ELSE public.mask_nip(nip)
  END AS nip,
  email,
  unit,
  keperluan,
  jumlah_peserta,
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
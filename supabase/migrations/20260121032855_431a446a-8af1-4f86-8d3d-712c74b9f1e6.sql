-- Fix security issues: Create minimal views and ensure proper RLS

-- Drop and recreate the masked view with ONLY necessary columns for regular users
-- Regular users should only see their OWN full records (via base table RLS)
-- The calendar needs minimal info about OTHER users' bookings

DROP VIEW IF EXISTS public.data_peminjaman_masked;

-- Create a calendar view that shows minimal info for scheduling conflict detection
-- This is what non-admin users will use to check availability
CREATE VIEW public.data_peminjaman_masked
WITH (security_invoker = on)
AS
SELECT
  id,
  user_id,
  asset_id,
  jenis_asset,
  tgl_mulai,
  tgl_selesai,
  jam_mulai,
  jam_selesai,
  status,
  catatan_admin,
  timestamp,
  created_at,
  updated_at,
  butuh_supir,
  jumlah_peserta,
  keperluan,
  -- Show full data for owner, anonymized for others
  CASE 
    WHEN user_id = auth.uid() THEN nama_pemohon
    ELSE 'Terpesan'
  END AS nama_pemohon,
  -- Show full NIP for owner only, hide completely for others
  CASE 
    WHEN user_id = auth.uid() THEN nip
    ELSE NULL
  END AS nip,
  -- Show full email for owner only, hide completely for others
  CASE 
    WHEN user_id = auth.uid() THEN email
    ELSE NULL
  END AS email,
  -- Show full unit for owner only, hide completely for others
  CASE 
    WHEN user_id = auth.uid() THEN unit
    ELSE NULL
  END AS unit
FROM public.data_peminjaman
WHERE status != 'Ditolak';  -- Hide rejected bookings from view
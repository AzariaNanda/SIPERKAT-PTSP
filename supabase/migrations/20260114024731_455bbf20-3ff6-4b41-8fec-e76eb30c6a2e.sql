-- Add butuh_supir column to data_peminjaman table
ALTER TABLE public.data_peminjaman 
ADD COLUMN butuh_supir text DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.data_peminjaman.butuh_supir IS 'Indicates if driver is needed: ya/tidak (only for kendaraan)';
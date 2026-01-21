-- Tambahkan kolom jumlah_peserta pada tabel data_peminjaman
ALTER TABLE public.data_peminjaman 
ADD COLUMN jumlah_peserta integer DEFAULT NULL;
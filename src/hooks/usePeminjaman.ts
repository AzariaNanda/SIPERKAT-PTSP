import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate, Enums } from '@/integrations/supabase/types';

export type Peminjaman = Tables<'data_peminjaman'>;
export type PeminjamanInsert = TablesInsert<'data_peminjaman'>;
export type PeminjamanUpdate = TablesUpdate<'data_peminjaman'>;
export type StatusPeminjaman = Enums<'status_peminjaman'>;
export type JenisAsset = Enums<'jenis_asset'>;

export const usePeminjaman = (isAdmin: boolean = false, userId?: string) => {
  const queryClient = useQueryClient();

  const { data: peminjamanList = [], isLoading, refetch } = useQuery({
    // QueryKey menyertakan userId agar cache data personal dan global tidak tabrakan
    queryKey: ['peminjaman', isAdmin, userId],
    queryFn: async () => {
      let query = supabase.from('data_peminjaman').select('*');

      if (isAdmin) {
        // ADMIN: Lihat semua data untuk manajemen
        query = query.order('created_at', { ascending: false });
      } else if (userId) {
        // USER RIWAYAT: Hanya filter milik user tertentu (Azaria)
        query = query.eq('user_id', userId).order('created_at', { ascending: false });
      } else {
        // GLOBAL CHECK: Ambil data global (tanpa filter user_id) untuk pengecekan bentrok jadwal
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Peminjaman[];
    },
  });

  // Sinkronisasi Real-time menggunakan Postgres Changes
  useEffect(() => {
    const channel = supabase.channel('peminjaman-sync')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'data_peminjaman' 
      }, () => {
        // Invalidate semua query peminjaman agar data selalu segar di semua komponen
        queryClient.invalidateQueries({ queryKey: ['peminjaman'] });
      })
      .subscribe();
    
    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [queryClient]);

  // LOGIKA NLP & OVERLAP WAKTU (The Core Logic)
  const checkScheduleConflict = (newBooking: any) => {
    return peminjamanList.filter(b => {
      // 1. Abaikan pengajuan yang sudah ditolak atau ID yang sama saat editing
      if (b.status === 'Ditolak' || b.id === newBooking.id) return false;
      
      // 2. Pastikan aset dan tanggalnya sama persis
      if (b.asset_id !== newBooking.asset_id || b.tgl_mulai !== newBooking.tgl_mulai) return false;

      // 3. NLP Logic: Konversi string waktu "HH:mm" ke total menit (Integer)
      //Mengubah Jam jadi Menit
      const toMin = (t: string) => {
        if (!t) return 0;
        const [h, m] = t.split(':').map(Number);
        return (h * 60) + m;
      };

      const startNew = toMin(newBooking.jam_mulai);
      const endNew = toMin(newBooking.jam_selesai);
      const startExist = toMin(b.jam_mulai);
      const endExist = toMin(b.jam_selesai);

      // Rule Overlap: (Waktu Mulai Baru < Waktu Selesai Lama) AND (Waktu Selesai Baru > Waktu Mulai Lama)
      //Bagian Cek Bentrok
      return startNew < endExist && endNew > startExist;
    });
  };

  const addPeminjaman = useMutation({
    mutationFn: async (payload: PeminjamanInsert) => {
      const { data, error } = await supabase
        .from('data_peminjaman')
        .insert(payload)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peminjaman'] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, catatan_admin }: { id: string; status: StatusPeminjaman; catatan_admin?: string }) => {
      const { data, error } = await supabase
        .from('data_peminjaman')
        .update({ status, catatan_admin })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['peminjaman'] });
      const displayStatus = data.status === 'Disetujui' ? 'Sedang dipakai' : data.status;
      toast.success(`Status diperbarui menjadi: ${displayStatus}`);
    },
  });

  return { 
    peminjamanList, 
    isLoading, 
    addPeminjaman, 
    updateStatus, 
    checkScheduleConflict, 
    refetch 
  };
};
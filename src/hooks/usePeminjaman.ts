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

export const usePeminjaman = (isAdmin: boolean = false) => {
  const queryClient = useQueryClient();

  const { data: peminjamanList = [], isLoading, refetch } = useQuery({
    queryKey: ['peminjaman', isAdmin],
    queryFn: async () => {
      // Admin melihat data lengkap, User melihat data melalui view masked untuk keamanan
      if (isAdmin) {
        const { data, error } = await supabase.from('data_peminjaman').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data as Peminjaman[];
      } else {
        const { data, error } = await supabase.from('data_peminjaman_masked').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data as Peminjaman[];
      }
    },
  });

  // Sinkronisasi Real-time agar kalender dan tabel admin langsung terupdate
  useEffect(() => {
    const channel = supabase.channel('peminjaman-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'data_peminjaman' }, 
      () => {
        // Refetch di background (tanpa mengubah state isLoading awal)
        queryClient.refetchQueries({ queryKey: ['peminjaman'], type: 'active' });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // LOGIKA DETEKSI BENTROK JADWAL
  const checkScheduleConflict = (newBooking: any) => {
    return peminjamanList.filter(b => {
      if (b.status === 'Ditolak' || b.id === newBooking.id) return false;
      if (b.asset_id !== newBooking.asset_id || b.jenis_asset !== newBooking.jenis_asset) return false;
      if (b.tgl_mulai !== newBooking.tgl_mulai) return false;
      
      // Deteksi tumpang tindih waktu (Overlap)
      return newBooking.jam_mulai < b.jam_selesai && newBooking.jam_selesai > b.jam_mulai;
    });
  };

  const addPeminjaman = useMutation({
    mutationFn: async (payload: PeminjamanInsert) => {
      const { data, error } = await supabase.from('data_peminjaman').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peminjaman'] });
      toast.success('Pengajuan peminjaman berhasil terkirim');
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, catatan_admin }: { id: string; status: StatusPeminjaman; catatan_admin?: string }) => {
      const { data, error } = await supabase.from('data_peminjaman').update({ status, catatan_admin }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['peminjaman'] });
      const displayStatus = data.status === 'Disetujui' ? 'Sedang dipakai' : data.status;
      toast.success(`Status diperbarui menjadi: ${displayStatus}`);
    },
  });

  return { peminjamanList, isLoading, addPeminjaman, updateStatus, checkScheduleConflict };
};

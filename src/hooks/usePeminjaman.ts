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

// Collision detection function - checks both 'Disetujui' and 'Pending' statuses
export const checkScheduleConflict = (
  newBooking: { 
    asset_id: string;
    jenis_asset: JenisAsset;
    tgl_mulai: string; 
    tgl_selesai: string;
    jam_mulai: string;
    jam_selesai: string;
    id?: string;
  },
  existingBookings: Peminjaman[]
): Peminjaman[] => {
  return existingBookings.filter(booking => {
    // Check both approved AND pending bookings for comprehensive conflict detection
    if (booking.status !== 'Disetujui' && booking.status !== 'Pending') return false;
    // Same asset type and ID
    if (booking.asset_id !== newBooking.asset_id || booking.jenis_asset !== newBooking.jenis_asset) return false;
    // Exclude self when updating
    if (booking.id === newBooking.id) return false;

    // Check time overlap
    const newStart = new Date(`${newBooking.tgl_mulai}T${newBooking.jam_mulai}`);
    const newEnd = new Date(`${newBooking.tgl_selesai}T${newBooking.jam_selesai}`);
    const existStart = new Date(`${booking.tgl_mulai}T${booking.jam_mulai}`);
    const existEnd = new Date(`${booking.tgl_selesai}T${booking.jam_selesai}`);

    return newStart < existEnd && newEnd > existStart;
  });
};

export const usePeminjaman = (isAdmin: boolean = false) => {
  const queryClient = useQueryClient();

  const { data: peminjamanList = [], isLoading, error, refetch } = useQuery({
    queryKey: ['peminjaman', isAdmin],
    queryFn: async () => {
      // Use masked view for admin panel - NIP is already masked server-side for non-owners
      const { data, error } = await supabase
        .from('data_peminjaman_masked')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Peminjaman[];
    },
  });

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('peminjaman-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'data_peminjaman'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['peminjaman'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const addPeminjaman = useMutation({
    mutationFn: async (newPeminjaman: PeminjamanInsert) => {
      const { data, error } = await supabase
        .from('data_peminjaman')
        .insert(newPeminjaman)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peminjaman'] });
      toast.success('Pengajuan peminjaman berhasil dikirim');
    },
    onError: (error: Error) => {
      toast.error('Gagal mengajukan peminjaman: ' + error.message);
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, catatan_admin }: { id: string; status: StatusPeminjaman; catatan_admin?: string }) => {
      const updateData: PeminjamanUpdate = { status };
      if (catatan_admin !== undefined) {
        updateData.catatan_admin = catatan_admin;
      }

      const { data, error } = await supabase
        .from('data_peminjaman')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['peminjaman'] });
      const statusMessages: Record<StatusPeminjaman, string> = {
        'Disetujui': 'Peminjaman telah disetujui',
        'Pending': 'Status diubah ke Pending',
        'Ditolak': 'Peminjaman telah ditolak',
        'Konflik': 'Peminjaman ditandai konflik',
      };
      toast.success(statusMessages[data.status]);
    },
    onError: (error: Error) => {
      toast.error('Gagal mengubah status: ' + error.message);
    },
  });

  return {
    peminjamanList,
    isLoading,
    error,
    refetch,
    addPeminjaman,
    updateStatus,
    checkScheduleConflict: (booking: Parameters<typeof checkScheduleConflict>[0]) => 
      checkScheduleConflict(booking, peminjamanList),
  };
};

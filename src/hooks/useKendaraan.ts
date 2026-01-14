import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Kendaraan = Tables<'master_kendaraan'>;
export type KendaraanInsert = TablesInsert<'master_kendaraan'>;
export type KendaraanUpdate = TablesUpdate<'master_kendaraan'>;

export const useKendaraan = () => {
  const queryClient = useQueryClient();

  const { data: kendaraanList = [], isLoading, error } = useQuery({
    queryKey: ['kendaraan'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('master_kendaraan')
        .select('*')
        .order('nama_kendaraan');
      
      if (error) throw error;
      return data as Kendaraan[];
    },
  });

  const addKendaraan = useMutation({
    mutationFn: async (newKendaraan: KendaraanInsert) => {
      const { data, error } = await supabase
        .from('master_kendaraan')
        .insert(newKendaraan)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kendaraan'] });
      toast.success('Kendaraan berhasil ditambahkan');
    },
    onError: (error: Error) => {
      toast.error('Gagal menambahkan kendaraan: ' + error.message);
    },
  });

  const updateKendaraan = useMutation({
    mutationFn: async ({ id, ...updates }: KendaraanUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('master_kendaraan')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kendaraan'] });
      toast.success('Kendaraan berhasil diperbarui');
    },
    onError: (error: Error) => {
      toast.error('Gagal memperbarui kendaraan: ' + error.message);
    },
  });

  const deleteKendaraan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('master_kendaraan')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kendaraan'] });
      toast.success('Kendaraan berhasil dihapus');
    },
    onError: (error: Error) => {
      toast.error('Gagal menghapus kendaraan: ' + error.message);
    },
  });

  return {
    kendaraanList,
    isLoading,
    error,
    addKendaraan,
    updateKendaraan,
    deleteKendaraan,
  };
};

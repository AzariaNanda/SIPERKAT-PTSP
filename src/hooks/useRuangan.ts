import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Ruangan = Tables<'master_ruangan'>;
export type RuanganInsert = TablesInsert<'master_ruangan'>;
export type RuanganUpdate = TablesUpdate<'master_ruangan'>;

export const useRuangan = () => {
  const queryClient = useQueryClient();

  const { data: ruanganList = [], isLoading, error } = useQuery({
    queryKey: ['ruangan'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('master_ruangan')
        .select('*')
        .order('nama_ruangan');
      
      if (error) throw error;
      return data as Ruangan[];
    },
  });

  const addRuangan = useMutation({
    mutationFn: async (newRuangan: RuanganInsert) => {
      const { data, error } = await supabase
        .from('master_ruangan')
        .insert(newRuangan)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ruangan'] });
      toast.success('Ruangan berhasil ditambahkan');
    },
    onError: (error: Error) => {
      toast.error('Gagal menambahkan ruangan: ' + error.message);
    },
  });

  const updateRuangan = useMutation({
    mutationFn: async ({ id, ...updates }: RuanganUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('master_ruangan')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ruangan'] });
      toast.success('Ruangan berhasil diperbarui');
    },
    onError: (error: Error) => {
      toast.error('Gagal memperbarui ruangan: ' + error.message);
    },
  });

  const deleteRuangan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('master_ruangan')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ruangan'] });
      toast.success('Ruangan berhasil dihapus');
    },
    onError: (error: Error) => {
      toast.error('Gagal menghapus ruangan: ' + error.message);
    },
  });

  return {
    ruanganList,
    isLoading,
    error,
    addRuangan,
    updateRuangan,
    deleteRuangan,
  };
};

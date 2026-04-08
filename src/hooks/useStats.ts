import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useStats = (selectedYear: number, userId?: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ['stats', selectedYear, userId], 
    queryFn: async () => {
      let query = supabase.from('data_peminjaman').select('*');
      
      // Perbaikan: Filter statistik jika user bukan admin
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const monthlyStats = Array.from({ length: 12 }, (_, i) => ({
    monthName: new Date(0, i).toLocaleString('id-ID', { month: 'long' }),
    kendaraan: 0,
    ruangan: 0,
    total: 0,
  }));

  let pendingCount = 0;
  let approvedCount = 0;
  const yearlyTotals = { total: 0, kendaraan: 0, ruangan: 0 };

  if (data && Array.isArray(data)) {
    data.forEach((item) => {
      if (!item.tgl_mulai) return;
      const date = new Date(item.tgl_mulai);
      if (date.getFullYear() === selectedYear) {
        const monthIndex = date.getMonth();
        const jenis = item.jenis_asset?.toLowerCase();
        
        if (jenis === 'kendaraan') {
          monthlyStats[monthIndex].kendaraan++;
          yearlyTotals.kendaraan++;
        } else {
          monthlyStats[monthIndex].ruangan++;
          yearlyTotals.ruangan++;
        }
        
        monthlyStats[monthIndex].total++;
        yearlyTotals.total++;

        const status = item.status?.toLowerCase();
        if (status === 'menunggu' || status === 'pending') pendingCount++;
        if (status === 'disetujui') approvedCount++;
      }
    });
  }

  return { monthlyStats, yearlyTotals, pendingCount, approvedCount, isLoading };
};
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useStats = (selectedYear: number, userId?: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ['stats', selectedYear, userId],
    queryFn: async () => {
      const yearStart = `${selectedYear}-01-01`;
      const yearEnd = `${selectedYear}-12-31`;

      let query = supabase
        .from('data_peminjaman')
        .select('tgl_mulai, jenis_asset, status')
        .gte('tgl_mulai', yearStart)
        .lte('tgl_mulai', yearEnd);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });

  const { monthlyStats, yearlyTotals, pendingCount, approvedCount } = useMemo(() => {
    const stats = Array.from({ length: 12 }, (_, i) => ({
      monthName: new Date(0, i).toLocaleString('id-ID', { month: 'long' }),
      kendaraan: 0,
      ruangan: 0,
      total: 0,
    }));

    let pending = 0;
    let approved = 0;
    const totals = { total: 0, kendaraan: 0, ruangan: 0 };

    if (data && Array.isArray(data)) {
      for (const item of data) {
        if (!item.tgl_mulai) continue;
        const monthIndex = new Date(item.tgl_mulai).getMonth();
        const jenis = item.jenis_asset?.toLowerCase();

        if (jenis === 'kendaraan') {
          stats[monthIndex].kendaraan++;
          totals.kendaraan++;
        } else {
          stats[monthIndex].ruangan++;
          totals.ruangan++;
        }

        stats[monthIndex].total++;
        totals.total++;

        const status = item.status?.toLowerCase();
        if (status === 'menunggu' || status === 'pending') pending++;
        if (status === 'disetujui') approved++;
      }
    }

    return { monthlyStats: stats, yearlyTotals: totals, pendingCount: pending, approvedCount: approved };
  }, [data]);

  return { monthlyStats, yearlyTotals, pendingCount, approvedCount, isLoading };
};

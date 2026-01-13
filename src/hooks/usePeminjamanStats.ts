import { useMemo } from 'react';
import type { Peminjaman, MonthlyStats } from '@/types/siperkat';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const usePeminjamanStats = (peminjaman: Peminjaman[], year: number) => {
  const monthlyStats = useMemo<MonthlyStats[]>(() => {
    return MONTH_NAMES.map((monthName, index) => {
      const monthPeminjaman = peminjaman.filter(p => {
        const date = new Date(p.timestamp);
        return date.getFullYear() === year && date.getMonth() === index;
      });

      const kendaraan = monthPeminjaman.filter(p => p.jenis === 'kendaraan').length;
      const ruangan = monthPeminjaman.filter(p => p.jenis === 'ruangan').length;

      return {
        month: String(index + 1).padStart(2, '0'),
        monthName,
        kendaraan,
        ruangan,
        total: kendaraan + ruangan,
      };
    });
  }, [peminjaman, year]);

  const yearlyTotals = useMemo(() => {
    return monthlyStats.reduce(
      (acc, s) => ({
        kendaraan: acc.kendaraan + s.kendaraan,
        ruangan: acc.ruangan + s.ruangan,
        total: acc.total + s.total,
      }),
      { kendaraan: 0, ruangan: 0, total: 0 }
    );
  }, [monthlyStats]);

  const pendingCount = useMemo(() => {
    return peminjaman.filter(p => p.status === 'Pending').length;
  }, [peminjaman]);

  const approvedCount = useMemo(() => {
    return peminjaman.filter(p => p.status === 'Disetujui').length;
  }, [peminjaman]);

  return {
    monthlyStats,
    yearlyTotals,
    pendingCount,
    approvedCount,
  };
};

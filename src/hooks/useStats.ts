import { useMemo } from 'react';
import { usePeminjaman, type Peminjaman } from '@/hooks/usePeminjaman';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export interface MonthlyStats {
  month: string;
  monthName: string;
  kendaraan: number;
  ruangan: number;
  total: number;
}

export const useStats = (year: number) => {
  const { peminjamanList, isLoading } = usePeminjaman(true);

  const monthlyStats = useMemo<MonthlyStats[]>(() => {
    return MONTH_NAMES.map((monthName, index) => {
      const monthPeminjaman = peminjamanList.filter(p => {
        const date = new Date(p.created_at);
        return date.getFullYear() === year && date.getMonth() === index;
      });

      const kendaraan = monthPeminjaman.filter(p => p.jenis_asset === 'kendaraan').length;
      const ruangan = monthPeminjaman.filter(p => p.jenis_asset === 'ruangan').length;

      return {
        month: String(index + 1).padStart(2, '0'),
        monthName,
        kendaraan,
        ruangan,
        total: kendaraan + ruangan,
      };
    });
  }, [peminjamanList, year]);

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
    return peminjamanList.filter(p => p.status === 'Pending').length;
  }, [peminjamanList]);

  const approvedCount = useMemo(() => {
    return peminjamanList.filter(p => p.status === 'Disetujui').length;
  }, [peminjamanList]);

  return { monthlyStats, yearlyTotals, pendingCount, approvedCount, isLoading };
};

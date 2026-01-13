import { useState } from 'react';
import { Car, Home, Calendar, TrendingUp, Clock, CheckCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from './StatCard';
import { MonthlyChart } from './MonthlyChart';
import { MonthlyTable } from './MonthlyTable';
import { usePeminjamanStats } from '@/hooks/usePeminjamanStats';
import { exportMonthlyStats, exportDetailedData } from '@/utils/exportExcel';
import type { Peminjaman, Kendaraan, Ruangan } from '@/types/siperkat';

interface DashboardProps {
  peminjaman: Peminjaman[];
  isAdmin: boolean;
  kendaraan: Kendaraan[];
  ruangan: Ruangan[];
}

export const Dashboard = ({ peminjaman, isAdmin, kendaraan, ruangan }: DashboardProps) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  
  const { monthlyStats, yearlyTotals, pendingCount, approvedCount } = usePeminjamanStats(peminjaman, selectedYear);

  const getAssetName = (assetId: string, jenis: 'kendaraan' | 'ruangan') => {
    if (jenis === 'kendaraan') {
      const k = kendaraan.find(x => x.id === assetId);
      return k ? `${k.nama_kendaraan} (${k.no_polisi})` : assetId;
    } else {
      const r = ruangan.find(x => x.id === assetId);
      return r ? r.nama_ruangan : assetId;
    }
  };

  const handleExportKendaraan = () => {
    exportMonthlyStats(monthlyStats, selectedYear, 'kendaraan');
  };

  const handleExportRuangan = () => {
    exportMonthlyStats(monthlyStats, selectedYear, 'ruangan');
  };

  const handleExportDetailKendaraan = () => {
    const yearPeminjaman = peminjaman.filter(p => {
      const date = new Date(p.timestamp);
      return date.getFullYear() === selectedYear;
    });
    exportDetailedData(yearPeminjaman, selectedYear, 'kendaraan', getAssetName);
  };

  const handleExportDetailRuangan = () => {
    const yearPeminjaman = peminjaman.filter(p => {
      const date = new Date(p.timestamp);
      return date.getFullYear() === selectedYear;
    });
    exportDetailedData(yearPeminjaman, selectedYear, 'ruangan', getAssetName);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary" />
            Dashboard Statistik
          </h2>
          <p className="text-muted-foreground mt-1">
            Rekap data peminjaman kendaraan dan ruang rapat
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Pilih Tahun" />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {isAdmin && (
            <>
              <Button onClick={handleExportDetailKendaraan} variant="outline" className="gap-2">
                <Car className="w-4 h-4" />
                Export Kendaraan
              </Button>
              <Button onClick={handleExportDetailRuangan} variant="outline" className="gap-2">
                <Home className="w-4 h-4" />
                Export Ruangan
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Peminjaman" value={yearlyTotals.total} icon={Calendar} description={`Tahun ${selectedYear}`} variant="primary" />
        <StatCard title="Peminjaman Kendaraan" value={yearlyTotals.kendaraan} icon={Car} description={`Tahun ${selectedYear}`} variant="accent" />
        <StatCard title="Peminjaman Ruangan" value={yearlyTotals.ruangan} icon={Home} description={`Tahun ${selectedYear}`} variant="success" />
        <StatCard title={isAdmin ? "Menunggu Persetujuan" : "Disetujui"} value={isAdmin ? pendingCount : approvedCount} icon={isAdmin ? Clock : CheckCircle} description="Status pengajuan" variant="warning" />
      </div>

      <MonthlyChart data={monthlyStats} year={selectedYear} />
      <MonthlyTable data={monthlyStats} year={selectedYear} yearlyTotals={yearlyTotals} isAdmin={isAdmin} onExport={() => exportMonthlyStats(monthlyStats, selectedYear)} />
    </div>
  );
};

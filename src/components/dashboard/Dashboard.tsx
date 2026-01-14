import { useState } from 'react';
import { Car, Home, Calendar, TrendingUp, Clock, CheckCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from './StatCard';
import { MonthlyChart } from './MonthlyChart';
import { MonthlyTable } from './MonthlyTable';
import { useStats } from '@/hooks/useStats';
import { exportAllDataSeparated } from '@/utils/exportSeparated';
import { usePeminjaman } from '@/hooks/usePeminjaman';

interface DashboardProps {
  isAdmin: boolean;
}

export const Dashboard = ({ isAdmin }: DashboardProps) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  
  const { monthlyStats, yearlyTotals, pendingCount, approvedCount, isLoading } = useStats(selectedYear);
  const { peminjamanList } = usePeminjaman(isAdmin);

  if (isLoading) {
    return <div className="flex justify-center p-8">Memuat data...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary" />
            Dashboard Statistik
          </h2>
          <p className="text-muted-foreground mt-1">Rekap data peminjaman kendaraan dan ruang rapat</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(Number(val))}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Pilih Tahun" /></SelectTrigger>
            <SelectContent>
              {years.map(year => (<SelectItem key={year} value={String(year)}>{year}</SelectItem>))}
            </SelectContent>
          </Select>
          
          {isAdmin && (
            <Button onClick={() => exportAllDataSeparated(peminjamanList, selectedYear)} className="gap-2">
              <Download className="w-4 h-4" />Export Semua
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Peminjaman" value={yearlyTotals.total} icon={Calendar} description={`Tahun ${selectedYear}`} variant="primary" />
        <StatCard title="Peminjaman Kendaraan" value={yearlyTotals.kendaraan} icon={Car} description={`Tahun ${selectedYear}`} variant="accent" />
        <StatCard title="Peminjaman Ruangan" value={yearlyTotals.ruangan} icon={Home} description={`Tahun ${selectedYear}`} variant="room" />
        <StatCard 
          title={isAdmin ? "Menunggu Persetujuan" : "Disetujui"} 
          value={isAdmin ? pendingCount : approvedCount} 
          icon={isAdmin ? Clock : CheckCircle} 
          description="Status pengajuan" 
          variant={isAdmin ? "warning" : "success"} 
        />
      </div>

      <MonthlyChart data={monthlyStats} year={selectedYear} />
      <MonthlyTable data={monthlyStats} year={selectedYear} yearlyTotals={yearlyTotals} isAdmin={isAdmin} />
    </div>
  );
};

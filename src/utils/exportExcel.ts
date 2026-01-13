import * as XLSX from 'xlsx';
import type { MonthlyStats, Peminjaman } from '@/types/siperkat';

export const exportMonthlyStats = (stats: MonthlyStats[], year: number) => {
  const data = stats.map(s => ({
    'Bulan': s.monthName,
    'Peminjaman Kendaraan': s.kendaraan,
    'Peminjaman Ruangan': s.ruangan,
    'Total Peminjaman': s.total,
  }));

  // Add totals row
  const totals = stats.reduce(
    (acc, s) => ({
      kendaraan: acc.kendaraan + s.kendaraan,
      ruangan: acc.ruangan + s.ruangan,
      total: acc.total + s.total,
    }),
    { kendaraan: 0, ruangan: 0, total: 0 }
  );

  data.push({
    'Bulan': 'TOTAL',
    'Peminjaman Kendaraan': totals.kendaraan,
    'Peminjaman Ruangan': totals.ruangan,
    'Total Peminjaman': totals.total,
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Statistik ${year}`);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 },
    { wch: 22 },
    { wch: 22 },
    { wch: 18 },
  ];

  XLSX.writeFile(workbook, `Laporan_Peminjaman_${year}.xlsx`);
};

export const exportDetailedData = (
  peminjaman: Peminjaman[], 
  year: number, 
  jenis: 'kendaraan' | 'ruangan',
  getAssetName: (assetId: string, jenis: 'kendaraan' | 'ruangan') => string
) => {
  const filteredData = peminjaman.filter(p => p.jenis_asset === jenis);
  
  const data = filteredData.map(p => ({
    'Tanggal Pengajuan': new Date(p.timestamp).toLocaleDateString('id-ID'),
    'Nama Aset': getAssetName(p.asset_id, p.jenis_asset),
    'Nama Pemohon': p.nama_pemohon,
    'NIP': p.nip,
    'Unit/Bidang': p.unit,
    'Email': p.email,
    'Tanggal Mulai': p.tgl_mulai,
    'Jam Mulai': p.jam_mulai,
    'Tanggal Selesai': p.tgl_selesai,
    'Jam Selesai': p.jam_selesai,
    'Keperluan': p.keperluan,
    'Status': p.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  
  const sheetName = jenis === 'kendaraan' ? 'Kendaraan' : 'Ruangan';
  
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 18 },
    { wch: 25 },
    { wch: 25 },
    { wch: 20 },
    { wch: 20 },
    { wch: 30 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
    { wch: 10 },
    { wch: 40 },
    { wch: 12 },
  ];

  const jenisLabel = jenis === 'kendaraan' ? 'Kendaraan' : 'Ruangan';
  XLSX.writeFile(workbook, `Detail_Peminjaman_${jenisLabel}_${year}.xlsx`);
};

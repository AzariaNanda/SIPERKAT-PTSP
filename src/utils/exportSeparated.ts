import * as XLSX from 'xlsx';
import type { Peminjaman } from '@/hooks/usePeminjaman';

// Helper untuk memformat tanggal agar rapi di Excel
const formatDate = (date: string) => new Date(date).toLocaleDateString('id-ID');

/**
 * Ekspor Data Pengajuan Kendaraan
 */
export const exportKendaraanData = (peminjaman: Peminjaman[], year: number, kendaraanList: any[]) => {
  const data = peminjaman
    .filter(p => p.jenis_asset === 'kendaraan')
    .map(p => {
      const aset = kendaraanList.find(k => k.id === p.asset_id);
      return {
        'TANGGAL PENGAJUAN': formatDate(p.created_at),
        'KETERANGAN': 'KENDARAAN',
        'NAMA KENDARAAN': aset ? `${aset.nama_kendaraan} (${aset.no_polisi})` : 'ASET DIHAPUS',
        'NAMA PEMOHON': p.nama_pemohon,
        'NIP': p.nip,
        'UNIT/BIDANG': p.unit,
        'TGL MULAI': p.tgl_mulai,
        'JAM': `${p.jam_mulai} - ${p.jam_selesai}`,
        'KEPERLUAN': p.keperluan,
        'STATUS': p.status,
      };
    });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Kendaraan');
  XLSX.writeFile(wb, `Data_Pengajuan_Kendaraan_${year}.xlsx`);
};

/**
 * Ekspor Data Pengajuan Ruangan
 */
export const exportRuanganData = (peminjaman: Peminjaman[], year: number, ruanganList: any[]) => {
  const data = peminjaman
    .filter(p => p.jenis_asset === 'ruangan')
    .map(p => {
      const aset = ruanganList.find(r => r.id === p.asset_id);
      return {
        'TANGGAL PENGAJUAN': formatDate(p.created_at),
        'KETERANGAN': 'RUANGAN',
        'NAMA RUANGAN': aset ? aset.nama_ruangan : 'ASET DIHAPUS',
        'NAMA PEMOHON': p.nama_pemohon,
        'NIP': p.nip,
        'UNIT/BIDANG': p.unit,
        'TGL MULAI': p.tgl_mulai,
        'JAM': `${p.jam_mulai} - ${p.jam_selesai}`,
        'KEPERLUAN': p.keperluan,
        'STATUS': p.status,
      };
    });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Ruangan');
  XLSX.writeFile(wb, `Data_Pengajuan_Ruangan_${year}.xlsx`);
};

/**
 * Ekspor Semua Data (Sheet Berbeda)
 */
export const exportAllDataSeparated = (peminjaman: Peminjaman[], year: number, kendaraanList: any[], ruanganList: any[]) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Kendaraan
  const kData = peminjaman.filter(p => p.jenis_asset === 'kendaraan').map(p => {
    const aset = kendaraanList.find(k => k.id === p.asset_id);
    return {
      'TGL PENGAJUAN': formatDate(p.created_at),
      'KETERANGAN': 'KENDARAAN',
      'NAMA ASET': aset ? `${aset.nama_kendaraan} (${aset.no_polisi})` : 'ASET DIHAPUS',
      'PEMOHON': p.nama_pemohon,
      'UNIT': p.unit,
      'WAKTU': `${p.tgl_mulai} (${p.jam_mulai} - ${p.jam_selesai})`,
      'STATUS': p.status
    };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kData), 'Pengajuan Kendaraan');

  // Sheet 2: Ruangan
  const rData = peminjaman.filter(p => p.jenis_asset === 'ruangan').map(p => {
    const aset = ruanganList.find(r => r.id === p.asset_id);
    return {
      'TGL PENGAJUAN': formatDate(p.created_at),
      'KETERANGAN': 'RUANGAN',
      'NAMA ASET': aset ? aset.nama_ruangan : 'ASET DIHAPUS',
      'PEMOHON': p.nama_pemohon,
      'UNIT': p.unit,
      'WAKTU': `${p.tgl_mulai} (${p.jam_mulai} - ${p.jam_selesai})`,
      'STATUS': p.status
    };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rData), 'Pengajuan Ruangan');

  XLSX.writeFile(wb, `Laporan_Peminjaman_Terpadu_${year}.xlsx`);
};
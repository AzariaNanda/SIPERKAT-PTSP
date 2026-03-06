import * as XLSX from 'xlsx';
import type { Peminjaman } from '@/hooks/usePeminjaman';

// Helper untuk memformat tanggal dan waktu (Timestamp)
const formatTimestamp = (date: string) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

/* Ekspor Data Pengajuan Kendaraan*/
export const exportKendaraanData = (peminjaman: Peminjaman[], year: number, kendaraanList: any[]) => {
  const data = peminjaman
    .filter(p => p.jenis_asset === 'kendaraan')
    .map(p => {
      const aset = kendaraanList.find(k => k.id === p.asset_id);
      return {
        'Timestamp': formatTimestamp(p.timestamp || p.created_at),
        'Nama Pemohon': p.nama_pemohon,
        'NIP': p.nip || '-',
        'Unit/Bidang': p.unit,
        'Email Pemohon': p.email,
        'Kendaraan Dipilih': aset ? `${aset.nama_kendaraan} (${aset.plat_nomor || aset.no_polisi})` : 'ASET DIHAPUS',
        'Tgl Mulai': p.tgl_mulai,
        'Jam Mulai': p.jam_mulai,
        'Tgl Selesai': p.tgl_selesai,
        'Jam Selesai': p.jam_selesai,
        'Keperluan': p.keperluan,
        'Supir (Ya/Tidak)': p.butuh_supir === 'ya' ? 'Ya' : 'Tidak',
        'Atasan Penyetuju': '-', // Placeholder
        'Status': p.status,
        'Catatan Admin': p.catatan_admin || '-',
      };
    });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Kendaraan');
  XLSX.writeFile(wb, `Data_Pengajuan_Kendaraan_${year}.xlsx`);
};

/*Ekspor Data Pengajuan Ruangan */
export const exportRuanganData = (peminjaman: Peminjaman[], year: number, ruanganList: any[]) => {
  const data = peminjaman
    .filter(p => p.jenis_asset === 'ruangan')
    .map(p => {
      const aset = ruanganList.find(r => r.id === p.asset_id);
      return {
        'Timestamp': formatTimestamp(p.timestamp || p.created_at),
        'Nama Pemohon': p.nama_pemohon,
        'Unit/Bidang': p.unit,
        'Email Pemohon': p.email,
        'Ruangan': aset ? aset.nama_ruangan : 'ASET DIHAPUS',
        'Tgl Mulai': p.tgl_mulai,
        'Jam Mulai': p.jam_mulai,
        'Tgl Selesai': p.tgl_selesai,
        'Jam Selesai': p.jam_selesai,
        'Agenda': p.keperluan,
        'Jumlah Peserta': p.jumlah_peserta || '-',
        'Kebutuhan Tambahan': '-', // Placeholder
        'Atasan Penyetuju': '-', // Placeholder
        'Status': p.status,
        'Catatan Admin': p.catatan_admin || '-',
      };
    });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Ruangan');
  XLSX.writeFile(wb, `Data_Pengajuan_Ruangan_${year}.xlsx`);
};

/*Ekspor Semua Data (Format diterapkan pada masing-masing sheet)*/
export const exportAllDataSeparated = (peminjaman: Peminjaman[], year: number, kendaraanList: any[], ruanganList: any[]) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Pengajuan Kendaraan
  const kData = peminjaman.filter(p => p.jenis_asset === 'kendaraan').map(p => {
    const aset = kendaraanList.find(k => k.id === p.asset_id);
    return {
      'Timestamp': formatTimestamp(p.timestamp || p.created_at),
      'Nama Pemohon': p.nama_pemohon,
      'NIP': p.nip || '-',
      'Unit/Bidang': p.unit,
      'Email Pemohon': p.email,
      'Kendaraan Dipilih': aset ? `${aset.nama_kendaraan} (${aset.plat_nomor || aset.no_polisi})` : 'ASET DIHAPUS',
      'Tgl Mulai': p.tgl_mulai,
      'Jam Mulai': p.jam_mulai,
      'Tgl Selesai': p.tgl_selesai,
      'Jam Selesai': p.jam_selesai,
      'Keperluan': p.keperluan,
      'Supir (Ya/Tidak)': p.butuh_supir === 'ya' ? 'Ya' : 'Tidak',
      'Atasan Penyetuju': '-',
      'Status': p.status,
      'Catatan Admin': p.catatan_admin || '-',
    };
  });
  if (kData.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kData), 'Pengajuan Kendaraan');
  }

  // Sheet 2: Pengajuan Ruangan
  const rData = peminjaman.filter(p => p.jenis_asset === 'ruangan').map(p => {
    const aset = ruanganList.find(r => r.id === p.asset_id);
    return {
      'Timestamp': formatTimestamp(p.timestamp || p.created_at),
      'Nama Pemohon': p.nama_pemohon,
      'Unit/Bidang': p.unit,
      'Email Pemohon': p.email,
      'Ruangan': aset ? aset.nama_ruangan : 'ASET DIHAPUS',
      'Tgl Mulai': p.tgl_mulai,
      'Jam Mulai': p.jam_mulai,
      'Tgl Selesai': p.tgl_selesai,
      'Jam Selesai': p.jam_selesai,
      'Agenda': p.keperluan,
      'Jumlah Peserta': p.jumlah_peserta || '-',
      'Kebutuhan Tambahan': '-',
      'Atasan Penyetuju': '-',
      'Status': p.status,
      'Catatan Admin': p.catatan_admin || '-',
    };
  });
  if (rData.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rData), 'Pengajuan Ruangan');
  }

  XLSX.writeFile(wb, `Laporan_Peminjaman_Terpadu_${year}.xlsx`);
};
import * as XLSX from 'xlsx';
import type { Peminjaman } from '@/hooks/usePeminjaman';

export const exportKendaraanData = (peminjaman: Peminjaman[], year: number) => {
  const kendaraanData = peminjaman.filter(p => p.jenis_asset === 'kendaraan');
  
  const data = kendaraanData.map(p => ({
    'Tanggal Pengajuan': new Date(p.created_at).toLocaleDateString('id-ID'),
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
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Kendaraan');
  XLSX.writeFile(workbook, `Data_Kendaraan_${year}.xlsx`);
};

export const exportRuanganData = (peminjaman: Peminjaman[], year: number) => {
  const ruanganData = peminjaman.filter(p => p.jenis_asset === 'ruangan');
  
  const data = ruanganData.map(p => ({
    'Tanggal Pengajuan': new Date(p.created_at).toLocaleDateString('id-ID'),
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
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Ruangan');
  XLSX.writeFile(workbook, `Data_Ruangan_${year}.xlsx`);
};

export const exportAllDataSeparated = (peminjaman: Peminjaman[], year: number) => {
  const workbook = XLSX.utils.book_new();

  // Sheet Kendaraan
  const kendaraanData = peminjaman.filter(p => p.jenis_asset === 'kendaraan').map(p => ({
    'Tanggal Pengajuan': new Date(p.created_at).toLocaleDateString('id-ID'),
    'Nama Pemohon': p.nama_pemohon,
    'NIP': p.nip,
    'Unit/Bidang': p.unit,
    'Tanggal Mulai': p.tgl_mulai,
    'Jam Mulai': p.jam_mulai,
    'Tanggal Selesai': p.tgl_selesai,
    'Jam Selesai': p.jam_selesai,
    'Keperluan': p.keperluan,
    'Status': p.status,
  }));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(kendaraanData), 'Kendaraan');

  // Sheet Ruangan
  const ruanganData = peminjaman.filter(p => p.jenis_asset === 'ruangan').map(p => ({
    'Tanggal Pengajuan': new Date(p.created_at).toLocaleDateString('id-ID'),
    'Nama Pemohon': p.nama_pemohon,
    'NIP': p.nip,
    'Unit/Bidang': p.unit,
    'Tanggal Mulai': p.tgl_mulai,
    'Jam Mulai': p.jam_mulai,
    'Tanggal Selesai': p.tgl_selesai,
    'Jam Selesai': p.jam_selesai,
    'Keperluan': p.keperluan,
    'Status': p.status,
  }));
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(ruanganData), 'Ruangan');

  XLSX.writeFile(workbook, `Laporan_Peminjaman_${year}.xlsx`);
};

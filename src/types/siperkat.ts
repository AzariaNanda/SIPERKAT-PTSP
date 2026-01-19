export interface Kendaraan {
  id: number;
  nama_kendaraan: string;
  no_polisi: string;
  penempatan: string;
  foto_url: string;
}

export interface Ruangan {
  id: number;
  nama_ruangan: string;
  lokasi: string;
  kapasitas: number;
  foto_url: string;
}

export interface Peminjaman {
  id: number;
  timestamp: string;
  jenis: 'kendaraan' | 'ruangan';
  nama_pemohon: string;
  nip: string;
  unit: string;
  email: string;
  asset_id: string;
  assetId: number;
  tgl_mulai: string;
  jam_mulai: string;
  tgl_selesai: string;
  jam_selesai: string;
  keperluan: string;
  butuh_supir: string | null; // 'ya' | 'tidak' | null - sesuai dengan database
  status: 'Pending' | 'Disetujui' | 'Ditolak' | 'Konflik';
  catatan_admin: string;
}

export interface MonthlyStats {
  month: string;
  monthName: string;
  kendaraan: number;
  ruangan: number;
  total: number;
}

export interface User {
  email: string;
}

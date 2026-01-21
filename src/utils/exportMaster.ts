import * as XLSX from 'xlsx';

export const exportMasterKendaraan = (data: any[]) => {
  const dataToExport = data.map(item => ({
    'NAMA KENDARAAN': item.nama_kendaraan.toUpperCase(),
    'NOMOR POLISI': item.no_polisi.toUpperCase(),
    'PENEMPATAN': item.penempatan.toUpperCase(),
    'FOTO URL': item.foto_url || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "MASTER KENDARAAN");
  XLSX.writeFile(workbook, "MASTER_DATA_KENDARAAN.xlsx");
};

export const exportMasterRuangan = (data: any[]) => {
  const dataToExport = data.map(item => ({
    'NAMA RUANGAN': item.nama_ruangan.toUpperCase(),
    'LOKASI': item.lokasi.toUpperCase(),
    'KAPASITAS (ORANG)': item.kapasitas,
    'FOTO URL': item.foto_url || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "MASTER RUANGAN");
  XLSX.writeFile(workbook, "MASTER_DATA_RUANGAN.xlsx");
};
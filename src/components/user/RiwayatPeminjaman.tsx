import { History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { usePeminjaman } from '@/hooks/usePeminjaman';
import { useKendaraan } from '@/hooks/useKendaraan';
import { useRuangan } from '@/hooks/useRuangan';

export const RiwayatPeminjaman = () => {
  const { peminjamanList, isLoading } = usePeminjaman();
  const { kendaraanList } = useKendaraan();
  const { ruanganList } = useRuangan();

  const getAssetName = (jenis_asset: string, asset_id: string) => {
    if (jenis_asset === 'kendaraan') {
      const k = kendaraanList.find(x => x.id === asset_id);
      return k ? `${k.nama_kendaraan} (${k.no_polisi})` : 'Unknown';
    } else {
      const r = ruanganList.find(x => x.id === asset_id);
      return r ? r.nama_ruangan : 'Unknown';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Memuat data...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Riwayat Peminjaman Saya
        </CardTitle>
      </CardHeader>
      <CardContent>
        {peminjamanList.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Belum ada riwayat peminjaman
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal Pengajuan</TableHead>
                  <TableHead>Jenis Aset</TableHead>
                  <TableHead>Aset</TableHead>
                  <TableHead>Tanggal Pinjam</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Keperluan</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {peminjamanList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell className="capitalize">{item.jenis_asset}</TableCell>
                    <TableCell>{getAssetName(item.jenis_asset, item.asset_id)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {item.tgl_mulai === item.tgl_selesai 
                        ? item.tgl_mulai 
                        : `${item.tgl_mulai} - ${item.tgl_selesai}`
                      }
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {item.jam_mulai} - {item.jam_selesai}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={item.keperluan}>
                      {item.keperluan}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                      {item.catatan_admin && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {item.catatan_admin}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

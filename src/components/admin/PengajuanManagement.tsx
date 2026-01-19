import { useState, useMemo } from 'react';
import { ClipboardList, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusButtons } from './StatusButtons';
import { usePeminjaman, type Peminjaman, type StatusPeminjaman } from '@/hooks/usePeminjaman';
import { useKendaraan } from '@/hooks/useKendaraan';
import { useRuangan } from '@/hooks/useRuangan';
import { toast } from 'sonner';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export const PengajuanManagement = () => {
  const { peminjamanList, isLoading, updateStatus, checkScheduleConflict } = usePeminjaman(true);
  const { kendaraanList } = useKendaraan();
  const { ruanganList } = useRuangan();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const getAssetName = (jenis_asset: string, asset_id: string) => {
    if (jenis_asset === 'kendaraan') {
      const k = kendaraanList.find(x => x.id === asset_id);
      return k ? `${k.nama_kendaraan} (${k.no_polisi})` : 'Unknown';
    } else {
      const r = ruanganList.find(x => x.id === asset_id);
      return r ? r.nama_ruangan : 'Unknown';
    }
  };

  const handleStatusChange = (id: string, status: StatusPeminjaman, catatan?: string) => {
    updateStatus.mutate({ id, status, catatan_admin: catatan });
  };

  const handleConflictCheck = (peminjaman: Peminjaman) => {
    const conflicts = checkScheduleConflict({
      asset_id: peminjaman.asset_id,
      jenis_asset: peminjaman.jenis_asset,
      tgl_mulai: peminjaman.tgl_mulai,
      tgl_selesai: peminjaman.tgl_selesai,
      jam_mulai: peminjaman.jam_mulai,
      jam_selesai: peminjaman.jam_selesai,
      id: peminjaman.id,
    });

    if (conflicts.length > 0) {
      const conflictStatus = conflicts[0].status;
      toast.error(
        <div>
          <p className="font-semibold">Konflik Jadwal Terdeteksi!</p>
          <p className="text-sm mt-1">
            Bentrok dengan peminjaman ({conflictStatus}) oleh {conflicts[0].nama_pemohon} pada {conflicts[0].tgl_mulai}
          </p>
        </div>
      );
      return true;
    }
    return false;
  };

  const pendingCount = peminjamanList.filter(p => p.status === 'Pending' || p.status === 'Konflik').length;

  // Pagination calculations
  const totalItems = peminjamanList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const paginatedList = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return peminjamanList.slice(startIndex, endIndex);
  }, [peminjamanList, currentPage, itemsPerPage]);

  // Reset to page 1 when items per page changes
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Memuat data...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Manajemen Pengajuan
          </span>
          <div className="flex items-center gap-4">
            {pendingCount > 0 && (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                {pendingCount} menunggu
              </span>
            )}
            <span className="text-sm text-muted-foreground font-normal">
              Total: {totalItems} data
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {peminjamanList.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Belum ada pengajuan peminjaman
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">No</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Pemohon</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Aset</TableHead>
                    <TableHead>Jadwal</TableHead>
                    <TableHead>Keperluan</TableHead>
                    <TableHead>Supir</TableHead>
                    <TableHead className="min-w-[200px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedList.map((item, index) => (
                    <TableRow key={item.id} className={item.status === 'Konflik' ? 'bg-orange-50' : ''}>
                      <TableCell className="text-muted-foreground text-sm">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.nama_pemohon}</div>
                          <div className="text-xs text-muted-foreground font-mono tracking-wide">
                            {item.nip || '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium capitalize">{item.jenis_asset}</div>
                          <div className="text-xs text-muted-foreground">
                            {getAssetName(item.jenis_asset, item.asset_id)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm">
                          <div>{item.tgl_mulai}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.jam_mulai} - {item.jam_selesai}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={item.keperluan}>
                        {item.keperluan}
                      </TableCell>
                      <TableCell>
                        {item.jenis_asset === 'kendaraan' ? (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            item.butuh_supir === 'ya' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {item.butuh_supir === 'ya' ? 'Butuh' : 'Tidak'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusButtons
                          peminjaman={item}
                          onStatusChange={handleStatusChange}
                          onConflictDetected={() => handleConflictCheck(item)}
                          isUpdating={updateStatus.isPending}
                        />
                        {item.catatan_admin && (
                          <div className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded">
                            <span className="font-medium">Catatan:</span> {item.catatan_admin}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tampilkan</span>
                <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                  <SelectTrigger className="w-[80px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEMS_PER_PAGE_OPTIONS.map(option => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">per halaman</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

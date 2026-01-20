import { useState, useMemo } from 'react';
import { 
  ClipboardList, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, 
  Clock, X, Check, MessageSquare, Pencil, LayoutDashboard, Car, Building2, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { usePeminjaman, type StatusPeminjaman } from '@/hooks/usePeminjaman';
import { useKendaraan } from '@/hooks/useKendaraan';
import { useRuangan } from '@/hooks/useRuangan';
import { toast } from 'sonner';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export const PengajuanManagement = () => {
  const { peminjamanList = [], isLoading, updateStatus } = usePeminjaman(true);
  const { kendaraanList = [] } = useKendaraan();
  const { ruanganList = [] } = useRuangan();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filterType, setFilterType] = useState('all');

  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const getAssetName = (jenis_asset: string, asset_id: string) => {
    if (jenis_asset === 'kendaraan') {
      const k = kendaraanList.find(x => x.id === asset_id);
      if (!k) return 'Aset dihapus';
      const nama = k.merk_tipe || k.nama_kendaraan || 'Tanpa Nama';
      const plat = k.plat_nomor || k.no_polisi || '-';
      return `${nama} (${plat})`;
    } else {
      const r = ruanganList.find(x => x.id === asset_id);
      return r ? (r.nama_ruangan || 'Tanpa Nama') : 'Aset dihapus';
    }
  };

  const handleAction = async (id: string, status: StatusPeminjaman, note?: string) => {
    if (status === 'Disetujui') {
      const item = peminjamanList.find(p => p.id === id);
      if (item) {
        const approvedConflict = peminjamanList.filter(b => 
          b.id !== id && b.status === 'Disetujui' && b.asset_id === item.asset_id &&
          b.tgl_mulai === item.tgl_mulai && (item.jam_mulai < b.jam_selesai && item.jam_selesai > b.jam_mulai)
        );

        if (approvedConflict.length > 0) {
          toast.error("TIDAK BISA ACC!", { 
            description: `Jadwal ini sudah resmi dipakai oleh ${approvedConflict[0].nama_pemohon}.` 
          });
          return;
        }
      }
    }
    
    await updateStatus.mutateAsync({ id, status, catatan_admin: note });
    setIsRejectOpen(false);
    setReason('');
  };

  const filteredData = useMemo(() => {
    if (filterType === 'all') return peminjamanList;
    return peminjamanList.filter(item => item.jenis_asset === filterType);
  }, [peminjamanList, filterType]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedList = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  if (isLoading) return <div className="p-12 text-center font-black animate-pulse text-primary tracking-widest uppercase">Memperbarui Data...</div>;

  return (
    <Card className="border-none shadow-2xl overflow-hidden bg-white">
      <CardHeader className="bg-slate-50/80 border-b p-6">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight text-slate-800">
            <div className="p-2 bg-primary rounded-lg shadow-lg">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            Manajemen Pengajuan
          </CardTitle>
          <Tabs value={filterType} onValueChange={(v) => { setFilterType(v); setCurrentPage(1); }} className="w-full lg:w-auto">
            <TabsList className="grid grid-cols-3 h-11 rounded-xl bg-slate-200/50 p-1 border border-slate-200">
              <TabsTrigger value="all" className="font-black text-[10px] uppercase tracking-widest">SEMUA</TabsTrigger>
              <TabsTrigger value="kendaraan" className="font-black text-[10px] uppercase tracking-widest text-primary">MOBIL</TabsTrigger>
              <TabsTrigger value="ruangan" className="font-black text-[10px] uppercase tracking-widest text-primary">RUANGAN</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-[60px] text-center font-black text-slate-400 text-[10px] uppercase tracking-widest">No</TableHead>
              {/* KOLOM BARU: TANGGAL PENGAJUAN */}
              <TableHead className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Tgl Pengajuan</TableHead>
              <TableHead className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Pemohon</TableHead>
              <TableHead className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Aset & Jadwal</TableHead>
              <TableHead className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Keperluan</TableHead>
              <TableHead className="text-center font-black text-slate-400 text-[10px] uppercase tracking-widest">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedList.map((item, index) => (
              <TableRow key={item.id} className={`${item.status === 'Konflik' ? 'bg-red-50/30' : ''} border-slate-50 hover:bg-slate-50/50 transition-all`}>
                <TableCell className="text-center font-mono text-xs text-slate-300">
                  {String((currentPage - 1) * itemsPerPage + index + 1).padStart(2, '0')}
                </TableCell>
                {/* DATA TANGGAL PENGAJUAN */}
                <TableCell>
                  <div className="flex items-center gap-2 text-[11px] font-black text-slate-600 uppercase tracking-tight">
                    <Calendar className="w-3 h-3 text-primary" />
                    {new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="text-[12px] font-black text-slate-black text-primary uppercase mb-1 tracking-tight">{item.nama_pemohon}</div>
                  <div className="text-[10px] text-slate-400 font-black text-primary uppercase tracking-widest mt-0.5">{item.unit} • NIP: {item.nip || '-'}</div>
                </TableCell>
                <TableCell>
                  <div className="text-[10px] font-black text-primary uppercase mb-1 tracking-widest">
                    {getAssetName(item.jenis_asset, item.asset_id)}
                  </div>
                  <div className="text-[10px] flex items-center gap-1.5 text-slate-500 font-bold uppercase">
                    <Clock className="w-3 h-3 text-slate-300"/> {item.tgl_mulai} | {item.jam_mulai} - {item.jam_selesai}
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <p className="text-[11px] text-slate-600 font-medium italic line-clamp-2 leading-relaxed">"{item.keperluan || '-'}"</p>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-2">
                    {item.status === 'Pending' || item.status === 'Konflik' ? (
                      <div className="flex gap-1.5 bg-white p-1.5 rounded-xl border shadow-sm">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8 text-[9px] font-black px-4 uppercase tracking-widest" onClick={() => handleAction(item.id, 'Disetujui')}>
                          SETUJU
                        </Button>
                        <Button size="sm" variant="destructive" className="h-8 text-[9px] font-black px-4 uppercase tracking-widest" onClick={() => { setSelectedId(item.id); setIsRejectOpen(true); }}>
                          TOLAK
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <StatusBadge status={item.status} />
                        <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200 text-slate-400 hover:text-primary transition-all" onClick={() => handleAction(item.id, 'Pending')}>
                          <Pencil className="w-3.5 h-3.5"/>
                        </Button>
                      </div>
                    )}
                    {item.catatan_admin && (
                      <div className="w-full max-w-[200px] p-2 bg-blue-50/50 rounded-lg border border-blue-100 flex items-start gap-2 shadow-sm">
                        <MessageSquare className="w-3 h-3 text-blue-400 mt-1 shrink-0" />
                        <p className="text-[9px] text-blue-800 leading-tight italic font-medium">
                          <span className="font-black uppercase text-[8px] not-italic mr-1 text-blue-900 tracking-tighter">CATATAN:</span> {item.catatan_admin}
                        </p>
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-slate-50/50 border-t gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tampilkan:</span>
            <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="w-[85px] h-9 font-black text-xs border-2 border-slate-200 bg-white rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="font-black">
                {ITEMS_PER_PAGE_OPTIONS.map(opt => <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-5">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Hal {currentPage} / {totalPages}</span>
            <div className="flex gap-2 bg-white p-1 rounded-xl border-2 border-slate-200 shadow-sm">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft className="h-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight className="h-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}><ChevronsRight className="h-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </CardContent>

      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-slate-800 tracking-tighter text-xl">
              ALASAN PENOLAKAN
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="Berikan alasan kenapa ditolak..." 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              className="min-h-[120px] bg-slate-50 border-2 border-slate-200 text-sm font-black focus:ring-primary rounded-xl placeholder:font-normal" 
            />
          </div>
          <DialogFooter className="flex items-center justify-end gap-4">
            <Button variant="ghost" onClick={() => setIsRejectOpen(false)} className="font-black text-xs uppercase tracking-tighter text-slate-500">
              BATAL
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedId && handleAction(selectedId, 'Ditolak', reason)} 
              disabled={!reason} 
              className="font-black text-xs uppercase tracking-tighter shadow-xl shadow-red-200 h-11 px-8 rounded-xl"
            >
              KONFIRMASI TOLAK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

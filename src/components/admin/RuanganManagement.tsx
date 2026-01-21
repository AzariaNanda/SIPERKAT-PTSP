import { useState } from 'react';
import { Plus, Pencil, Trash2, Building2, Upload, Search, Users, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useRuangan, type Ruangan, type RuanganInsert } from '@/hooks/useRuangan';
import { supabase } from '@/integrations/supabase/client';
import { exportMasterRuangan } from '@/utils/exportMaster';
import { toast } from 'sonner';

export const RuanganManagement = () => {
  const { ruanganList = [], isLoading, addRuangan, updateRuangan, deleteRuangan } = useRuangan();
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedItem, setSelectedItem] = useState<Ruangan | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    nama_ruangan: '',
    lokasi: '',
    kapasitas: '',
    foto_url: '',
  });

  // Filter pencarian agar konsisten dengan halaman Kendaraan
  const filteredData = ruanganList.filter(r => 
    r.nama_ruangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.lokasi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    if (ruanganList.length === 0) {
      toast.error('DATA RUANGAN KOSONG, TIDAK DAPAT EKSPOR');
      return;
    }
    exportMasterRuangan(ruanganList);
    toast.success('MASTER DATA RUANGAN BERHASIL DIEKSPOR');
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ nama_ruangan: '', lokasi: '', kapasitas: '', foto_url: '' });
    setShowModal(true);
  };

  const openEditModal = (item: Ruangan) => {
    setModalMode('edit');
    setSelectedItem(item);
    setFormData({
      nama_ruangan: item.nama_ruangan,
      lokasi: item.lokasi,
      kapasitas: String(item.kapasitas),
      foto_url: item.foto_url || '',
    });
    setShowModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `ruangan_${Date.now()}.${fileExt}`;
    const filePath = `ruangan/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(filePath, file);

    if (uploadError) {
      toast.error('Gagal mengupload foto: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('assets').getPublicUrl(filePath);
    setFormData(prev => ({ ...prev, foto_url: data.publicUrl }));
    setUploading(false);
    toast.success('Foto berhasil diupload');
  };

  const handleSave = async () => {
    if (!formData.nama_ruangan || !formData.lokasi || !formData.kapasitas) {
      toast.error('Mohon lengkapi semua field');
      return;
    }

    if (modalMode === 'add') {
      const newData: RuanganInsert = {
        nama_ruangan: formData.nama_ruangan,
        lokasi: formData.lokasi,
        kapasitas: parseInt(formData.kapasitas),
        foto_url: formData.foto_url || null,
      };
      addRuangan.mutate(newData);
    } else if (selectedItem) {
      updateRuangan.mutate({
        id: selectedItem.id,
        nama_ruangan: formData.nama_ruangan,
        lokasi: formData.lokasi,
        kapasitas: parseInt(formData.kapasitas),
        foto_url: formData.foto_url || null,
      });
    }

    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    deleteRuangan.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center font-black animate-pulse text-primary tracking-widest uppercase">
        Memperbarui Database Ruangan...
      </div>
    );
  }

  return (
    <Card className="border-none shadow-2xl overflow-hidden bg-white">
      <CardHeader className="bg-slate-50/80 border-b p-6">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tighter text-slate-800">
            <div className="p-2 bg-primary rounded-lg shadow-lg shadow-primary/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            Manajemen Ruangan
          </CardTitle>
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="CARI RUANGAN..." 
                className="pl-10 font-black text-[10px] uppercase tracking-widest bg-white border-2 focus:ring-primary h-11 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Tombol Export Ruangan */}
            <Button 
              variant="outline" 
              onClick={handleExport}
              className="font-black text-[10px] uppercase tracking-widest h-11 px-6 rounded-xl border-2 hover:bg-slate-100 transition-all shadow-sm"
            >
              <FileDown className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button onClick={openAddModal} className="font-black text-[10px] uppercase tracking-widest h-11 px-6 rounded-xl shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" /> Tambah Ruang
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-[80px] font-black text-slate-400 text-[10px] uppercase tracking-widest px-6">Foto</TableHead>
              <TableHead className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Detail Ruangan</TableHead>
              <TableHead className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Kapasitas</TableHead>
              <TableHead className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Lokasi</TableHead>
              <TableHead className="text-center font-black text-slate-400 text-[10px] uppercase tracking-widest">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item) => (
              <TableRow key={item.id} className="border-slate-50 hover:bg-slate-50/50 transition-all">
                <TableCell className="px-6 py-4">
                  {item.foto_url ? (
                    <img 
                      src={item.foto_url} 
                      alt={item.nama_ruangan}
                      className="w-16 h-12 object-cover rounded-lg shadow-sm border border-slate-200"
                    />
                  ) : (
                    <div className="w-16 h-12 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                      <Building2 className="w-6 h-6 text-slate-300" />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-black text-slate-800 text-[13px] uppercase tracking-tight">
                    {item.nama_ruangan}
                  </div>
                  <div className="text-[9px] text-primary font-black uppercase tracking-widest mt-0.5">
                    Ruang Rapat Aktif
                  </div>
                </TableCell>
                <TableCell>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg font-black text-[11px] text-blue-700 border border-blue-100">
                    <Users className="w-3 h-3" /> {item.kapasitas} ORANG
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {item.lokasi}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-1.5">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => openEditModal(item)}
                      className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-primary transition-all shadow-sm"
                    >
                      <Pencil className="w-4 h-4"/>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleDelete(item.id)}
                      className="h-9 w-9 rounded-xl border-slate-200 text-slate-400 hover:text-destructive transition-all shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredData.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">
                  Data Ruangan Tidak Ditemukan
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-slate-800 tracking-tighter text-xl">
              {modalMode === 'add' ? 'TAMBAH RUANGAN BARU' : 'EDIT DETAIL RUANGAN'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-black text-[10px] uppercase text-slate-500 tracking-widest">Nama Ruangan</Label>
              <Input
                value={formData.nama_ruangan}
                onChange={(e) => setFormData({ ...formData, nama_ruangan: e.target.value })}
                placeholder="CONTOH: RUANG RAPAT LANTAI 1"
                className="bg-slate-50 border-2 border-slate-200 font-black text-sm rounded-xl h-11 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-black text-[10px] uppercase text-slate-500 tracking-widest">Lokasi</Label>
              <Input
                value={formData.lokasi}
                onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                placeholder="CONTOH: GEDUNG UTAMA"
                className="bg-slate-50 border-2 border-slate-200 font-black text-sm rounded-xl h-11 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-black text-[10px] uppercase text-slate-500 tracking-widest">Kapasitas (Orang)</Label>
              <Input
                type="number"
                value={formData.kapasitas}
                onChange={(e) => setFormData({ ...formData, kapasitas: e.target.value })}
                placeholder="0"
                className="bg-slate-50 border-2 border-slate-200 font-black text-sm rounded-xl h-11 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-black text-[10px] uppercase text-slate-500 tracking-widest">Foto Ruangan</Label>
              <div className="flex items-center gap-4 mt-2 p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
                {formData.foto_url && (
                  <img 
                    src={formData.foto_url} 
                    alt="Preview" 
                    className="w-20 h-14 object-cover rounded-lg shadow-md border border-white"
                  />
                )}
                <label className="cursor-pointer flex-1">
                  <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-primary/20 bg-white rounded-xl hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest text-primary shadow-sm">
                    <Upload className="w-4 h-4" />
                    <span>{uploading ? 'UPLOADING...' : 'UPLOAD FOTO'}</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowModal(false)} className="font-black text-xs uppercase tracking-tighter text-slate-500">
              BATAL
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={addRuangan.isPending || updateRuangan.isPending}
              className="font-black text-xs uppercase tracking-tighter shadow-xl shadow-primary/20 h-11 px-8 rounded-xl"
            >
              {addRuangan.isPending || updateRuangan.isPending ? 'MENYIMPAN...' : 'SIMPAN DATA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
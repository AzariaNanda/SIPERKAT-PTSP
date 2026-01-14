import { useState } from 'react';
import { Plus, Edit2, Trash2, Home, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useRuangan, type Ruangan, type RuanganInsert } from '@/hooks/useRuangan';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const RuanganManagement = () => {
  const { ruanganList, isLoading, addRuangan, updateRuangan, deleteRuangan } = useRuangan();
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedItem, setSelectedItem] = useState<Ruangan | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    nama_ruangan: '',
    lokasi: '',
    kapasitas: '',
    foto_url: '',
  });

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
    return <div className="flex justify-center p-8">Memuat data...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Home className="w-5 h-5" />
          Manajemen Ruangan
        </CardTitle>
        <Button onClick={openAddModal} className="gap-2">
          <Plus className="w-4 h-4" />
          Tambah Ruangan
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Foto</TableHead>
              <TableHead>Nama Ruangan</TableHead>
              <TableHead>Lokasi</TableHead>
              <TableHead>Kapasitas</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ruanganList.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.foto_url ? (
                    <img 
                      src={item.foto_url} 
                      alt={item.nama_ruangan}
                      className="w-16 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                      <Home className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{item.nama_ruangan}</TableCell>
                <TableCell>{item.lokasi}</TableCell>
                <TableCell>{item.kapasitas} orang</TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => openEditModal(item)}
                    className="mr-2"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {ruanganList.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Belum ada data ruangan
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalMode === 'add' ? 'Tambah Ruangan' : 'Edit Ruangan'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="nama_ruangan">Nama Ruangan</Label>
              <Input
                id="nama_ruangan"
                value={formData.nama_ruangan}
                onChange={(e) => setFormData({ ...formData, nama_ruangan: e.target.value })}
                placeholder="Ruang Rapat Utama"
              />
            </div>
            <div>
              <Label htmlFor="lokasi">Lokasi</Label>
              <Input
                id="lokasi"
                value={formData.lokasi}
                onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                placeholder="Lantai 2"
              />
            </div>
            <div>
              <Label htmlFor="kapasitas">Kapasitas (orang)</Label>
              <Input
                id="kapasitas"
                type="number"
                value={formData.kapasitas}
                onChange={(e) => setFormData({ ...formData, kapasitas: e.target.value })}
                placeholder="50"
              />
            </div>
            <div>
              <Label htmlFor="foto">Foto Ruangan</Label>
              <div className="flex items-center gap-4 mt-2">
                {formData.foto_url && (
                  <img 
                    src={formData.foto_url} 
                    alt="Preview" 
                    className="w-20 h-14 object-cover rounded"
                  />
                )}
                <label className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>{uploading ? 'Mengupload...' : 'Upload Foto'}</span>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={addRuangan.isPending || updateRuangan.isPending}>
              {addRuangan.isPending || updateRuangan.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

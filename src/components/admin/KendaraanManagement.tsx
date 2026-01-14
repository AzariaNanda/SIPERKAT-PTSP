import { useState } from 'react';
import { Plus, Edit2, Trash2, Car, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useKendaraan, type Kendaraan, type KendaraanInsert } from '@/hooks/useKendaraan';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const KendaraanManagement = () => {
  const { kendaraanList, isLoading, addKendaraan, updateKendaraan, deleteKendaraan } = useKendaraan();
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedItem, setSelectedItem] = useState<Kendaraan | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    nama_kendaraan: '',
    no_polisi: '',
    penempatan: '',
    foto_url: '',
  });

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ nama_kendaraan: '', no_polisi: '', penempatan: '', foto_url: '' });
    setShowModal(true);
  };

  const openEditModal = (item: Kendaraan) => {
    setModalMode('edit');
    setSelectedItem(item);
    setFormData({
      nama_kendaraan: item.nama_kendaraan,
      no_polisi: item.no_polisi,
      penempatan: item.penempatan,
      foto_url: item.foto_url || '',
    });
    setShowModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `kendaraan_${Date.now()}.${fileExt}`;
    const filePath = `kendaraan/${fileName}`;

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
    if (!formData.nama_kendaraan || !formData.no_polisi || !formData.penempatan) {
      toast.error('Mohon lengkapi semua field');
      return;
    }

    if (modalMode === 'add') {
      const newData: KendaraanInsert = {
        nama_kendaraan: formData.nama_kendaraan,
        no_polisi: formData.no_polisi,
        penempatan: formData.penempatan,
        foto_url: formData.foto_url || null,
      };
      addKendaraan.mutate(newData);
    } else if (selectedItem) {
      updateKendaraan.mutate({
        id: selectedItem.id,
        nama_kendaraan: formData.nama_kendaraan,
        no_polisi: formData.no_polisi,
        penempatan: formData.penempatan,
        foto_url: formData.foto_url || null,
      });
    }

    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    deleteKendaraan.mutate(id);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Memuat data...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Car className="w-5 h-5" />
          Manajemen Kendaraan
        </CardTitle>
        <Button onClick={openAddModal} className="gap-2">
          <Plus className="w-4 h-4" />
          Tambah Kendaraan
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Foto</TableHead>
              <TableHead>Nama Kendaraan</TableHead>
              <TableHead>No. Polisi</TableHead>
              <TableHead>Penempatan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {kendaraanList.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.foto_url ? (
                    <img 
                      src={item.foto_url} 
                      alt={item.nama_kendaraan}
                      className="w-16 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-12 bg-muted rounded flex items-center justify-center">
                      <Car className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{item.nama_kendaraan}</TableCell>
                <TableCell>{item.no_polisi}</TableCell>
                <TableCell>{item.penempatan}</TableCell>
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
            {kendaraanList.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Belum ada data kendaraan
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
              {modalMode === 'add' ? 'Tambah Kendaraan' : 'Edit Kendaraan'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="nama_kendaraan">Nama Kendaraan</Label>
              <Input
                id="nama_kendaraan"
                value={formData.nama_kendaraan}
                onChange={(e) => setFormData({ ...formData, nama_kendaraan: e.target.value })}
                placeholder="Toyota Avanza"
              />
            </div>
            <div>
              <Label htmlFor="no_polisi">No. Polisi</Label>
              <Input
                id="no_polisi"
                value={formData.no_polisi}
                onChange={(e) => setFormData({ ...formData, no_polisi: e.target.value })}
                placeholder="R 1234 AB"
              />
            </div>
            <div>
              <Label htmlFor="penempatan">Penempatan</Label>
              <Input
                id="penempatan"
                value={formData.penempatan}
                onChange={(e) => setFormData({ ...formData, penempatan: e.target.value })}
                placeholder="Kantor Utama"
              />
            </div>
            <div>
              <Label htmlFor="foto">Foto Kendaraan</Label>
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
            <Button onClick={handleSave} disabled={addKendaraan.isPending || updateKendaraan.isPending}>
              {addKendaraan.isPending || updateKendaraan.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

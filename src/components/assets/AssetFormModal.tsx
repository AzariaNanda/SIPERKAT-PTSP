import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Kendaraan, Ruangan } from '@/types/siperkat';
import { useSignedUrl } from '@/hooks/useSignedUrl';

interface AssetFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'kendaraan' | 'ruangan';
  mode: 'add' | 'edit';
  asset?: Kendaraan | Ruangan | null;
  onSave: (data: any) => Promise<boolean>;
}

export const AssetFormModal = ({ 
  open, 
  onOpenChange, 
  type, 
  mode, 
  asset, 
  onSave 
}: AssetFormModalProps) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    nama_kendaraan: '',
    no_polisi: '',
    penempatan: '',
    nama_ruangan: '',
    lokasi: '',
    kapasitas: 10,
    foto_url: '',
  });
  
  // Use signed URL for preview
  const { signedUrl: previewUrl, loading: previewLoading } = useSignedUrl(formData.foto_url);

  useEffect(() => {
    if (asset && mode === 'edit') {
      if (type === 'kendaraan') {
        const k = asset as Kendaraan;
        setFormData({
          nama_kendaraan: k.nama_kendaraan,
          no_polisi: k.no_polisi,
          penempatan: k.penempatan,
          nama_ruangan: '',
          lokasi: '',
          kapasitas: 10,
          foto_url: k.foto_url || '',
        });
      } else {
        const r = asset as Ruangan;
        setFormData({
          nama_kendaraan: '',
          no_polisi: '',
          penempatan: '',
          nama_ruangan: r.nama_ruangan,
          lokasi: r.lokasi,
          kapasitas: r.kapasitas,
          foto_url: r.foto_url || '',
        });
      }
    } else {
      setFormData({
        nama_kendaraan: '',
        no_polisi: '',
        penempatan: '',
        nama_ruangan: '',
        lokasi: '',
        kapasitas: 10,
        foto_url: '',
      });
    }
  }, [asset, mode, type, open]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;
      const filePath = `${type}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Store the file path (not URL) for signed URL generation later
      setFormData({ ...formData, foto_url: filePath });
      toast.success('Foto berhasil diupload');
    } catch (error: any) {
      toast.error('Gagal upload foto: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let data: any;
    if (type === 'kendaraan') {
      if (!formData.nama_kendaraan || !formData.no_polisi || !formData.penempatan) {
        toast.error('Mohon lengkapi semua field');
        setLoading(false);
        return;
      }
      data = {
        nama_kendaraan: formData.nama_kendaraan,
        no_polisi: formData.no_polisi,
        penempatan: formData.penempatan,
        foto_url: formData.foto_url || null,
      };
    } else {
      if (!formData.nama_ruangan || !formData.lokasi) {
        toast.error('Mohon lengkapi semua field');
        setLoading(false);
        return;
      }
      data = {
        nama_ruangan: formData.nama_ruangan,
        lokasi: formData.lokasi,
        kapasitas: formData.kapasitas,
        foto_url: formData.foto_url || null,
      };
    }

    const success = await onSave(data);
    if (success) {
      onOpenChange(false);
    }
    setLoading(false);
  };

  const title = `${mode === 'add' ? 'Tambah' : 'Edit'} ${type === 'kendaraan' ? 'Kendaraan' : 'Ruangan'}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'kendaraan' ? (
            <>
              <div className="space-y-2">
                <Label>Nama Kendaraan</Label>
                <Input
                  value={formData.nama_kendaraan}
                  onChange={(e) => setFormData({ ...formData, nama_kendaraan: e.target.value })}
                  placeholder="Contoh: Toyota Avanza"
                />
              </div>
              <div className="space-y-2">
                <Label>No. Polisi</Label>
                <Input
                  value={formData.no_polisi}
                  onChange={(e) => setFormData({ ...formData, no_polisi: e.target.value })}
                  placeholder="Contoh: R 1234 AB"
                />
              </div>
              <div className="space-y-2">
                <Label>Penempatan</Label>
                <Input
                  value={formData.penempatan}
                  onChange={(e) => setFormData({ ...formData, penempatan: e.target.value })}
                  placeholder="Contoh: Kantor Utama"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Nama Ruangan</Label>
                <Input
                  value={formData.nama_ruangan}
                  onChange={(e) => setFormData({ ...formData, nama_ruangan: e.target.value })}
                  placeholder="Contoh: Ruang Rapat Utama"
                />
              </div>
              <div className="space-y-2">
                <Label>Lokasi</Label>
                <Input
                  value={formData.lokasi}
                  onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                  placeholder="Contoh: Lantai 2"
                />
              </div>
              <div className="space-y-2">
                <Label>Kapasitas</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.kapasitas}
                  onChange={(e) => setFormData({ ...formData, kapasitas: parseInt(e.target.value) || 10 })}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Foto</Label>
            {formData.foto_url ? (
              <div className="relative">
                {previewLoading ? (
                  <div className="w-full h-40 flex items-center justify-center bg-muted rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <img 
                    src={previewUrl || formData.foto_url} 
                    alt="Preview" 
                    className="w-full h-40 object-cover rounded-lg"
                  />
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={() => setFormData({ ...formData, foto_url: '' })}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  {uploading ? 'Mengupload...' : 'Klik untuk upload foto'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" className="flex-1" disabled={loading || uploading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

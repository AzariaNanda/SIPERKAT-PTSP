import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { usePeminjaman, type PeminjamanInsert, type JenisAsset } from '@/hooks/usePeminjaman';
import { useKendaraan } from '@/hooks/useKendaraan';
import { useRuangan } from '@/hooks/useRuangan';
import { toast } from 'sonner';

export const PeminjamanForm = () => {
  const { user } = useAuth();
  const { addPeminjaman, checkScheduleConflict } = usePeminjaman();
  const { kendaraanList } = useKendaraan();
  const { ruanganList } = useRuangan();

  const [formData, setFormData] = useState({
    jenis_asset: 'kendaraan' as JenisAsset,
    nama_pemohon: '',
    nip: '',
    unit: '',
    asset_id: '',
    tgl_mulai: '',
    jam_mulai: '',
    tgl_selesai: '',
    jam_selesai: '',
    keperluan: '',
    butuh_supir: '' as '' | 'ya' | 'tidak',
  });

  const handleSubmit = () => {
    // Validation
    if (!formData.nama_pemohon || !formData.nip || !formData.unit || 
        !formData.asset_id || !formData.tgl_mulai || !formData.jam_mulai || 
        !formData.tgl_selesai || !formData.jam_selesai || !formData.keperluan) {
      toast.error('Mohon lengkapi semua field');
      return;
    }

    // NIP validation - minimal 11 karakter
    if (formData.nip.length < 11) {
      toast.error('NIP minimal 11 karakter');
      return;
    }

    // Butuh supir validation for kendaraan
    if (formData.jenis_asset === 'kendaraan' && !formData.butuh_supir) {
      toast.error('Mohon pilih apakah membutuhkan supir');
      return;
    }

    if (!user?.id || !user?.email) {
      toast.error('Sesi tidak valid, silakan login ulang');
      return;
    }

    // Check for conflicts
    const conflicts = checkScheduleConflict({
      asset_id: formData.asset_id,
      jenis_asset: formData.jenis_asset,
      tgl_mulai: formData.tgl_mulai,
      tgl_selesai: formData.tgl_selesai,
      jam_mulai: formData.jam_mulai,
      jam_selesai: formData.jam_selesai,
    });

    const newPeminjaman: PeminjamanInsert = {
      user_id: user.id,
      email: user.email,
      nama_pemohon: formData.nama_pemohon,
      nip: formData.nip,
      unit: formData.unit,
      asset_id: formData.asset_id,
      jenis_asset: formData.jenis_asset,
      tgl_mulai: formData.tgl_mulai,
      tgl_selesai: formData.tgl_selesai,
      jam_mulai: formData.jam_mulai,
      jam_selesai: formData.jam_selesai,
      keperluan: formData.keperluan,
      status: conflicts.length > 0 ? 'Konflik' : 'Pending',
      butuh_supir: formData.jenis_asset === 'kendaraan' ? formData.butuh_supir : null,
    };

    if (conflicts.length > 0) {
      toast.warning('Pengajuan terdeteksi konflik jadwal! Status: Konflik');
    }

    addPeminjaman.mutate(newPeminjaman, {
      onSuccess: () => {
        // Reset form
        setFormData({
          jenis_asset: 'kendaraan',
          nama_pemohon: '',
          nip: '',
          unit: '',
          asset_id: '',
          tgl_mulai: '',
          jam_mulai: '',
          tgl_selesai: '',
          jam_selesai: '',
          keperluan: '',
          butuh_supir: '',
        });
      }
    });
  };

  const availableAssets = formData.jenis_asset === 'kendaraan' ? kendaraanList : ruanganList;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          Form Pengajuan Peminjaman
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="jenis_asset">Jenis Aset</Label>
            <Select
              value={formData.jenis_asset}
              onValueChange={(value: JenisAsset) => setFormData({ ...formData, jenis_asset: value, asset_id: '' })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Pilih jenis aset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kendaraan">Kendaraan</SelectItem>
                <SelectItem value="ruangan">Ruang Rapat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="asset_id">Pilih {formData.jenis_asset === 'kendaraan' ? 'Kendaraan' : 'Ruangan'}</Label>
            <Select
              value={formData.asset_id}
              onValueChange={(value) => setFormData({ ...formData, asset_id: value })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder={`Pilih ${formData.jenis_asset}`} />
              </SelectTrigger>
              <SelectContent>
                {availableAssets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {formData.jenis_asset === 'kendaraan' 
                      ? `${(asset as any).nama_kendaraan} (${(asset as any).no_polisi})`
                      : (asset as any).nama_ruangan
                    }
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="nama_pemohon">Nama Pemohon</Label>
            <Input
              id="nama_pemohon"
              value={formData.nama_pemohon}
              onChange={(e) => setFormData({ ...formData, nama_pemohon: e.target.value })}
              placeholder="Masukkan nama lengkap"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="nip">NIP</Label>
            <Input
              id="nip"
              value={formData.nip}
              onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
              placeholder="Masukkan NIP (minimal 11 karakter)"
              className="mt-2"
              minLength={11}
            />
            <p className="text-xs text-muted-foreground mt-1">Minimal 11 karakter</p>
          </div>

          <div>
            <Label htmlFor="unit">Unit/Bidang</Label>
            <Input
              id="unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="Masukkan unit/bidang"
              className="mt-2"
            />
          </div>


          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="tgl_mulai">Tanggal Mulai</Label>
              <Input
                id="tgl_mulai"
                type="date"
                value={formData.tgl_mulai}
                onChange={(e) => setFormData({ ...formData, tgl_mulai: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="jam_mulai">Jam Mulai</Label>
              <Input
                id="jam_mulai"
                type="time"
                value={formData.jam_mulai}
                onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="tgl_selesai">Tanggal Selesai</Label>
              <Input
                id="tgl_selesai"
                type="date"
                value={formData.tgl_selesai}
                onChange={(e) => setFormData({ ...formData, tgl_selesai: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="jam_selesai">Jam Selesai</Label>
              <Input
                id="jam_selesai"
                type="time"
                value={formData.jam_selesai}
                onChange={(e) => setFormData({ ...formData, jam_selesai: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="keperluan">Keperluan</Label>
            <Textarea
              id="keperluan"
              value={formData.keperluan}
              onChange={(e) => setFormData({ ...formData, keperluan: e.target.value })}
              placeholder="Jelaskan keperluan peminjaman"
              className="mt-2"
              rows={3}
            />
          </div>

          {formData.jenis_asset === 'kendaraan' && (
            <div className="md:col-span-2">
              <Label>Apakah membutuhkan supir?</Label>
              <div className="flex gap-3 mt-2">
                <Button
                  type="button"
                  variant={formData.butuh_supir === 'ya' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setFormData({ ...formData, butuh_supir: 'ya' })}
                >
                  Iya
                </Button>
                <Button
                  type="button"
                  variant={formData.butuh_supir === 'tidak' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setFormData({ ...formData, butuh_supir: 'tidak' })}
                >
                  Tidak
                </Button>
              </div>
            </div>
          )}
        </div>

        <Button 
          onClick={handleSubmit} 
          className="w-full mt-6 h-12"
          disabled={addPeminjaman.isPending}
        >
          {addPeminjaman.isPending ? 'Mengirim...' : 'Kirim Pengajuan'}
        </Button>
      </CardContent>
    </Card>
  );
};

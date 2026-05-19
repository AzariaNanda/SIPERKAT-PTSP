import { useState } from 'react';
import { Send, Users } from 'lucide-react'; 
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
import { BookingCalendar } from './BookingCalendar';
import { toast } from 'sonner';

export const PeminjamanForm = () => {
  const { user } = useAuth();
  const { addPeminjaman, checkScheduleConflict, peminjamanList = [] } = usePeminjaman();
  const { kendaraanList = [] } = useKendaraan();
  const { ruanganList = [] } = useRuangan();

  const [formData, setFormData] = useState({
    jenis_asset: 'kendaraan' as JenisAsset,
    nama_pemohon: '',
    nip: '',
    unit: '',
    jumlah_peserta: '', 
    asset_id: '',
    tgl_mulai: '',
    jam_mulai: '',
    tgl_selesai: '',
    jam_selesai: '',
    keperluan: '',
    butuh_supir: '' as '' | 'ya' | 'tidak',
  });

  const handleSubmit = async () => {
    // 1. Validasi Input Dasar
    if (!formData.nama_pemohon || !formData.nip || !formData.asset_id || !formData.tgl_mulai || !formData.jam_mulai || !formData.jam_selesai) {
      toast.error('MOHON LENGKAPI SEMUA FIELD');
      return;
    }

    if (!user?.id) {
      toast.error('SESI TIDAK VALID');
      return;
    }

    // 2. DETEKSI BENTROK JADWAL (Logika Global - FIRST COME FIRST SERVED)
    const conflicts = checkScheduleConflict({
      asset_id: formData.asset_id,
      tgl_mulai: formData.tgl_mulai,
      jam_mulai: formData.jam_mulai,
      jam_selesai: formData.jam_selesai,
    });

    // 🔴 BLOCK JIKA ADA CONFLICT DENGAN STATUS APAPUN (Approved atau Pending)
    // Prioritas: Siapa yang booking duluan dapat haknya
    if (conflicts.length > 0) {
      const conflict = conflicts[0]; // Ambil conflict pertama
      const statusText = conflict.status === 'Disetujui' ? 'Sedang dipakai' : conflict.status;
      
      toast.error(`❌ JADWAL TIDAK TERSEDIA`, {
        description: `${conflict.nama_pemohon} sudah memesan waktu ${conflict.jam_mulai} - ${conflict.jam_selesai} (${statusText}). Silakan pilih waktu lain.`,
        duration: 6000,
        style: { background: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' }
      });
      return; // STOP SUBMIT - Block apapun conflict status
    }

    // 3. PROSES SUBMIT
    const newPeminjaman: PeminjamanInsert = {
      user_id: user.id,
      email: user.email || '',
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
      jumlah_peserta: formData.jenis_asset === 'ruangan' ? parseInt(formData.jumlah_peserta) : null,
      status: 'Pending',
      butuh_supir: formData.jenis_asset === 'kendaraan' ? formData.butuh_supir : null,
    };

    addPeminjaman.mutate(newPeminjaman, {
      onSuccess: () => {
        setFormData({
          ...formData,
          asset_id: '',
          keperluan: '',
          jumlah_peserta: '',
          butuh_supir: '',
        });
        toast.success('PENGAJUAN BERHASIL DIKIRIM');
      }
    });
  };

  const availableAssets = formData.jenis_asset === 'kendaraan' ? kendaraanList : ruanganList;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <BookingCalendar
          bookings={peminjamanList}
          selectedAssetId={formData.asset_id}
          jenisAsset={formData.jenis_asset}
          onDateSelect={(date) => {
            const formattedDate = date.toISOString().split('T')[0];
            setFormData({ ...formData, tgl_mulai: formattedDate, tgl_selesai: formattedDate });
          }}
        />
      </div>

      <Card className="lg:col-span-2 shadow-xl border-none">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="flex items-center gap-2 font-bold uppercase text-slate-800">
            <Send className="w-5 h-5 text-primary" />
            Form Pengajuan Peminjaman
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-semibold uppercase text-xs text-slate-500">Jenis Aset</Label>
              <Select
                value={formData.jenis_asset}
                onValueChange={(value: JenisAsset) => setFormData({ ...formData, jenis_asset: value, asset_id: '', butuh_supir: '', jumlah_peserta: '' })}
              >
                <SelectTrigger className="bg-slate-50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kendaraan">Kendaraan</SelectItem>
                  <SelectItem value="ruangan">Ruang Rapat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold uppercase text-xs text-slate-500">Pilih Aset</Label>
              <Select
                value={formData.asset_id}
                onValueChange={(value) => setFormData({ ...formData, asset_id: value })}
              >
                <SelectTrigger className="bg-slate-50"><SelectValue placeholder="Pilih..." /></SelectTrigger>
                <SelectContent>
                  {availableAssets.map((asset: any) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {formData.jenis_asset === 'kendaraan' 
                        ? `${asset.nama_kendaraan} (${asset.plat_nomor})`
                        : asset.nama_ruangan
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold uppercase text-xs text-slate-500">Nama Pemohon</Label>
              <Input
                value={formData.nama_pemohon}
                onChange={(e) => setFormData({ ...formData, nama_pemohon: e.target.value })}
                placeholder="NAMA LENGKAP"
                className="bg-slate-50"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold uppercase text-xs text-slate-500">NIP</Label>
              <Input
                value={formData.nip}
                maxLength={18}
                onChange={(e) => setFormData({ ...formData, nip: e.target.value.replace(/\D/g, '') })}
                placeholder="18 DIGIT ANGKA"
                className="bg-slate-50"
              />
            </div>

            <div className={formData.jenis_asset === 'ruangan' ? "space-y-2" : "space-y-2 md:col-span-2"}>
              <Label className="font-semibold uppercase text-xs text-slate-500">Unit / Bidang</Label>
              <Input
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="BIDANG KERJA"
                className="bg-slate-50"
              />
            </div>

            {formData.jenis_asset === 'ruangan' && (
              <div className="space-y-2">
                <Label className="font-semibold uppercase text-xs text-slate-500">Jumlah Peserta</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formData.jumlah_peserta}
                    onChange={(e) => setFormData({ ...formData, jumlah_peserta: e.target.value.replace(/\D/g, '') })}
                    placeholder="0"
                    className="bg-slate-50 pl-10"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-100/50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1"><Label className="text-[10px] font-bold uppercase">Tgl Mulai</Label><Input type="date" value={formData.tgl_mulai} onChange={(e) => setFormData({ ...formData, tgl_mulai: e.target.value })} className="h-9 bg-white" /></div>
            <div className="space-y-1"><Label className="text-[10px] font-bold uppercase">Jam Mulai</Label><Input type="time" value={formData.jam_mulai} onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })} className="h-9 bg-white" /></div>
            <div className="space-y-1"><Label className="text-[10px] font-bold uppercase">Tgl Selesai</Label><Input type="date" value={formData.tgl_selesai} onChange={(e) => setFormData({ ...formData, tgl_selesai: e.target.value })} className="h-9 bg-white" /></div>
            <div className="space-y-1"><Label className="text-[10px] font-bold uppercase">Jam Selesai</Label><Input type="time" value={formData.jam_selesai} onChange={(e) => setFormData({ ...formData, jam_selesai: e.target.value })} className="h-9 bg-white" /></div>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold uppercase text-xs text-slate-500">Keperluan</Label>
            <Textarea
              value={formData.keperluan}
              onChange={(e) => setFormData({ ...formData, keperluan: e.target.value })}
              placeholder="DETAIL KEPERLUAN..."
              rows={3}
              className="bg-slate-50"
            />
          </div>

          {formData.jenis_asset === 'kendaraan' && (
            <div className="space-y-2">
              <Label className="font-semibold uppercase text-xs text-slate-500 text-center block">Butuh supir?</Label>
              <div className="flex gap-3 mt-2">
                <Button type="button" variant={formData.butuh_supir === 'ya' ? 'default' : 'outline'} className="flex-1 font-bold" onClick={() => setFormData({ ...formData, butuh_supir: 'ya' })}>IYA</Button>
                <Button type="button" variant={formData.butuh_supir === 'tidak' ? 'default' : 'outline'} className="flex-1 font-bold" onClick={() => setFormData({ ...formData, butuh_supir: 'tidak' })}>TIDAK</Button>
              </div>
            </div>
          )}

          <Button onClick={handleSubmit} className="w-full h-12 font-black uppercase tracking-widest" disabled={addPeminjaman.isPending}>
            {addPeminjaman.isPending ? 'MENGIRIM...' : 'KIRIM PENGAJUAN'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
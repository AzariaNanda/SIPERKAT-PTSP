import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Peminjaman, JenisAsset } from '@/hooks/usePeminjaman';

interface BookingCalendarProps {
  bookings: Peminjaman[];
  selectedAssetId: string;
  jenisAsset: JenisAsset;
  onDateSelect?: (date: Date) => void;
}

export const BookingCalendar = ({ 
  bookings = [], 
  selectedAssetId, 
  jenisAsset,
  onDateSelect 
}: BookingCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // 1. Sinkronisasi Data: Filter pengajuan yang aktif untuk aset terpilih
  const relevantBookings = useMemo(() => {
    return bookings.filter(
      (b) =>
        b.asset_id === selectedAssetId &&
        b.jenis_asset === jenisAsset &&
        ['Disetujui', 'Pending', 'Konflik'].includes(b.status)
    );
  }, [bookings, selectedAssetId, jenisAsset]);

  // 2. Mapping Modifiers untuk warna kalender
  const modifiers = useMemo(() => {
    const approved: Date[] = [];
    const pending: Date[] = [];
    const conflict: Date[] = [];

    relevantBookings.forEach((b) => {
      const start = startOfDay(parseISO(b.tgl_mulai));
      const end = startOfDay(parseISO(b.tgl_selesai));
      
      let current = new Date(start);
      while (current <= end) {
        const dateCopy = new Date(current);
        if (b.status === 'Disetujui') approved.push(dateCopy);
        else if (b.status === 'Pending') pending.push(dateCopy);
        else if (b.status === 'Konflik') conflict.push(dateCopy);
        
        current.setDate(current.getDate() + 1);
      }
    });

    return { approved, pending, conflict };
  }, [relevantBookings]);

  // 3. Styling Warna Kalender (Hijau = Sedang dipakai, Kuning = Menunggu)
  const modifiersStyles = {
    approved: { backgroundColor: '#e1c0a3', color: '#991b1b', fontWeight: 'bold', borderRadius: '8px' },
    pending: { backgroundColor: '#fef9c3', color: '#854d0e', fontWeight: 'bold', borderRadius: '8px' },
  };

  // 4. Detail jadwal pada tanggal yang diklik
  const selectedDateBookings = useMemo(() => {
    if (!selectedDate) return [];
    const d = startOfDay(selectedDate);
    return relevantBookings.filter((b) => {
      const start = startOfDay(parseISO(b.tgl_mulai));
      const end = startOfDay(parseISO(b.tgl_selesai));
      return d >= start && d <= end;
    });
  }, [selectedDate, relevantBookings]);

  if (!selectedAssetId) {
    return (
      <Card className="border-dashed bg-slate-50/50">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
            <CalendarDays className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Pilih Aset Terlebih Dahulu</p>
          <p className="text-xs text-slate-400 mt-1">Jadwal akan muncul setelah Anda memilih unit.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl border-none overflow-hidden bg-white">
      <CardHeader className="bg-slate-50/80 border-b pb-4">
        <CardTitle className="text-sm font-black uppercase tracking-tighter flex items-center gap-2 text-slate-700">
          <CalendarDays className="w-4 h-4 text-primary" />
          Jadwal {jenisAsset === 'kendaraan' ? 'Kendaraan' : 'Ruangan'}
        </CardTitle>
        {/* Legend/Keterangan Warna */}
        <div className="flex flex-wrap gap-3 mt-3">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
            <div className="w-2.5 h-2.5 rounded-full bg-red-200 border border-red-400" /> Sedang dipakai
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-200 border border-yellow-400" /> Menunggu
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(d) => { setSelectedDate(d); if (d && onDateSelect) onDateSelect(d); }}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          locale={id}
          className="rounded-xl border shadow-inner"
        />

        <div className="mt-6 space-y-3">
          <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
            <Clock className="w-3 h-3" />
            {selectedDate ? format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id }) : 'Pilih Tanggal'}
          </h4>

          {selectedDateBookings.length > 0 ? (
            <div className="space-y-2">
              {selectedDateBookings.map((b) => (
                <div key={b.id} className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
                  b.status === 'Disetujui' ? 'bg-red-50 border-red-100' : 
                  b.status === 'Konflik' ? 'bg-red-50 border-red-100' : 'bg-yellow-50 border-yellow-100'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-slate-700">{b.jam_mulai} - {b.jam_selesai}</span>
                    <Badge className={`text-[9px] font-black uppercase px-2 h-5 border-none ${
                      b.status === 'Disetujui' ? 'bg-red-600' : 
                      b.status === 'Konflik' ? 'bg-red-600' : 'bg-yellow-500 text-white'
                    }`}>
                      {b.status === 'Disetujui' ? 'Sedang dipakai' : b.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] font-bold text-slate-600 uppercase truncate">{b.nama_pemohon}</p>
                  <p className="text-[10px] text-slate-400 italic leading-tight">"{b.keperluan}"</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
              <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-2" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jadwal Kosong / Tersedia</p>
            </div>
          )}
        </div>

        {relevantBookings.length > 0 && (
          <div className="mt-6 p-3 bg-primary/5 rounded-xl border border-primary/10">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-primary mt-0.5" />
              <p className="text-[9px] text-slate-500 leading-relaxed font-medium">
                Klik pada tanggal berwarna untuk melihat detail pemakaian aset. Pastikan tidak mengajukan di jam yang sama dengan status <strong>Sedang dipakai</strong>.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, AlertCircle } from 'lucide-react';
import { format, isSameDay, parseISO, isWithinInterval } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Peminjaman, JenisAsset } from '@/hooks/usePeminjaman';

interface BookingCalendarProps {
  bookings: Peminjaman[];
  selectedAssetId: string;
  jenisAsset: JenisAsset;
  onDateSelect?: (date: Date) => void;
}

export const BookingCalendar = ({ 
  bookings, 
  selectedAssetId, 
  jenisAsset,
  onDateSelect 
}: BookingCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Filter bookings for the selected asset with Sedang Digunakan or Pending status
  const relevantBookings = useMemo(() => {
    return bookings.filter(
      (b) =>
        b.asset_id === selectedAssetId &&
        b.jenis_asset === jenisAsset &&
        (b.status === 'Sedang Digunakan' || b.status === 'Pending')
    );
  }, [bookings, selectedAssetId, jenisAsset]);

  // Get dates that have bookings
  const bookedDates = useMemo(() => {
    const dates: Date[] = [];
    relevantBookings.forEach((booking) => {
      const startDate = parseISO(booking.tgl_mulai);
      const endDate = parseISO(booking.tgl_selesai);
      
      // Add all dates in the range
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
    return dates;
  }, [relevantBookings]);

  // Get bookings for selected date
  const selectedDateBookings = useMemo(() => {
    if (!selectedDate) return [];
    return relevantBookings.filter((booking) => {
      const startDate = parseISO(booking.tgl_mulai);
      const endDate = parseISO(booking.tgl_selesai);
      return isWithinInterval(selectedDate, { start: startDate, end: endDate });
    });
  }, [selectedDate, relevantBookings]);

  // Custom modifier for booked dates
  const modifiers = useMemo(() => ({
    booked: bookedDates,
    approved: bookedDates.filter((date) =>
      relevantBookings.some(
        (b) =>
          b.status === 'Sedang Digunakan' &&
          isWithinInterval(date, {
            start: parseISO(b.tgl_mulai),
            end: parseISO(b.tgl_selesai),
          })
      )
    ),
    pending: bookedDates.filter((date) =>
      relevantBookings.some(
        (b) =>
          b.status === 'Pending' &&
          isWithinInterval(date, {
            start: parseISO(b.tgl_mulai),
            end: parseISO(b.tgl_selesai),
          })
      )
    ),
  }), [bookedDates, relevantBookings]);

  const modifiersStyles = {
    booked: {
      backgroundColor: 'hsl(var(--destructive) / 0.1)',
      borderRadius: '0',
    },
    approved: {
      backgroundColor: 'hsl(var(--destructive) / 0.2)',
      color: 'hsl(var(--destructive))',
      fontWeight: 600,
    },
    pending: {
      backgroundColor: 'hsl(48 96% 89%)',
      color: 'hsl(45 93% 30%)',
      fontWeight: 600,
    },
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && onDateSelect) {
      onDateSelect(date);
    }
  };

  if (!selectedAssetId) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-muted-foreground">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Pilih aset terlebih dahulu untuk melihat jadwal</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="w-5 h-5" />
          Jadwal {jenisAsset === 'kendaraan' ? 'Kendaraan' : 'Ruangan'}
        </CardTitle>
        <div className="flex gap-3 mt-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-destructive/20" />
            <span>Sedang Digunakan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(48 96% 89%)' }} />
            <span>Pending</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          locale={id}
          className="rounded-md border w-full"
        />

        {selectedDate && (
          <div className="mt-4 border-t pt-4">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id })}
            </h4>
            {selectedDateBookings.length > 0 ? (
              <div className="space-y-2">
                {selectedDateBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className={`p-3 rounded-lg text-sm ${
                      booking.status === 'Sedang Digunakan'
                        ? 'bg-destructive/10 border border-destructive/20'
                        : 'bg-yellow-50 border border-yellow-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{booking.jam_mulai} - {booking.jam_selesai}</span>
                      <Badge variant={booking.status === 'Sedang Digunakan' ? 'destructive' : 'outline'}>
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {booking.nama_pemohon} • {booking.unit}
                    </p>
                    <p className="text-muted-foreground text-xs mt-1 truncate">
                      {booking.keperluan}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="text-green-600">✓</span> Tersedia pada tanggal ini
              </p>
            )}
          </div>
        )}

        {relevantBookings.length > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Klik pada tanggal untuk melihat detail jadwal. Tarikh dengan warna merah/kuning sudah ditempah.
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

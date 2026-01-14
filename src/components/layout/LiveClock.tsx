import { useState, useEffect } from 'react';

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export const LiveClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="text-right">
      <div className="text-2xl font-bold text-primary-foreground">
        {formatTime(time)}
      </div>
      <div className="text-sm text-primary-foreground/80">
        {DAYS[time.getDay()]}, {time.getDate()} {MONTHS[time.getMonth()]} {time.getFullYear()}
      </div>
    </div>
  );
};

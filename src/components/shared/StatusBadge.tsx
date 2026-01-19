import { Badge } from '@/components/ui/badge';
import type { StatusPeminjaman } from '@/hooks/usePeminjaman';

interface StatusBadgeProps {
  status: StatusPeminjaman;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getStatusConfig = (status: StatusPeminjaman) => {
    switch (status) {
      case 'Disetujui':
        // Label diubah dari 'Disetujui' menjadi 'Sedang dipakai'
        return { className: 'bg-green-100 text-green-800 border-green-300', label: 'Disetujui' };
      case 'Pending':
        return { className: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Pending' };
      case 'Ditolak':
        return { className: 'bg-red-100 text-red-800 border-red-300', label: 'Ditolak' };
      case 'Konflik':
        return { className: 'bg-orange-100 text-orange-800 border-orange-300', label: 'Konflik' };
      default:
        return { className: 'bg-gray-100 text-gray-800 border-gray-300', label: status };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant="outline" className={`${config.className} font-medium`}>
      {config.label}
    </Badge>
  );
};

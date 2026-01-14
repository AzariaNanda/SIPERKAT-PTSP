import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, Car, Home, MapPin, Users } from 'lucide-react';
import type { Kendaraan, Ruangan } from '@/types/siperkat';
import { useSignedUrl } from '@/hooks/useSignedUrl';

interface AssetCardProps {
  asset: Kendaraan | Ruangan;
  type: 'kendaraan' | 'ruangan';
  isAdmin: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const AssetCard = ({ asset, type, isAdmin, onEdit, onDelete }: AssetCardProps) => {
  const isKendaraan = type === 'kendaraan';
  const kendaraan = asset as Kendaraan;
  const ruangan = asset as Ruangan;
  
  // Use signed URL for private bucket access
  const { signedUrl, loading: imageLoading } = useSignedUrl(asset.foto_url);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-muted relative overflow-hidden">
        {imageLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : signedUrl ? (
          <img
            src={signedUrl}
            alt={isKendaraan ? kendaraan.nama_kendaraan : ruangan.nama_ruangan}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            {isKendaraan ? (
              <Car className="w-16 h-16 text-primary/40" />
            ) : (
              <Home className="w-16 h-16 text-success/40" />
            )}
          </div>
        )}
        {isAdmin && (
          <div className="absolute top-2 right-2 flex gap-1">
            <Button size="icon" variant="secondary" className="h-8 w-8" onClick={onEdit}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="destructive" className="h-8 w-8" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg truncate">
          {isKendaraan ? kendaraan.nama_kendaraan : ruangan.nama_ruangan}
        </h3>
        {isKendaraan ? (
          <>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-mono bg-muted px-2 py-0.5 rounded">
                {kendaraan.no_polisi}
              </span>
            </p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
              <MapPin className="w-4 h-4" />
              {kendaraan.penempatan}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="w-4 h-4" />
              {ruangan.lokasi}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Users className="w-4 h-4" />
              Kapasitas: {ruangan.kapasitas} orang
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

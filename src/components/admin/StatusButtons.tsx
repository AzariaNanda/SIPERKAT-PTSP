import { Check, X, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import type { StatusPeminjaman, Peminjaman } from '@/hooks/usePeminjaman';

interface StatusButtonsProps {
  peminjaman: Peminjaman;
  onStatusChange: (id: string, status: StatusPeminjaman, catatan?: string) => void;
  onConflictDetected?: () => boolean; // Returns true if conflict exists
  isUpdating?: boolean;
}

export const StatusButtons = ({ 
  peminjaman, 
  onStatusChange, 
  onConflictDetected,
  isUpdating = false 
}: StatusButtonsProps) => {
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<StatusPeminjaman | null>(null);
  const [catatan, setCatatan] = useState(peminjaman.catatan_admin || '');

  const handleStatusClick = (status: StatusPeminjaman) => {
    if (status === 'Disetujui' && onConflictDetected) {
      const hasConflict = onConflictDetected();
      if (hasConflict) {
        return; // Don't proceed if conflict detected
      }
    }

    if (status === 'Ditolak' || status === 'Konflik') {
      setPendingStatus(status);
      setShowNoteDialog(true);
    } else {
      onStatusChange(peminjaman.id, status);
    }
  };

  const handleConfirmWithNote = () => {
    if (pendingStatus) {
      onStatusChange(peminjaman.id, pendingStatus, catatan);
      setShowNoteDialog(false);
      setPendingStatus(null);
    }
  };

  return (
    <>
      <div className="flex gap-1.5 flex-wrap">
        <Button
          size="sm"
          variant={peminjaman.status === 'Disetujui' ? 'default' : 'outline'}
          className={`h-7 px-2 text-xs ${
            peminjaman.status === 'Disetujui' 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'border-green-600 text-green-600 hover:bg-green-50'
          }`}
          onClick={() => handleStatusClick('Disetujui')}
          disabled={isUpdating}
        >
          <Check className="w-3 h-3 mr-1" />
          Setujui
        </Button>
        
        <Button
          size="sm"
          variant={peminjaman.status === 'Pending' ? 'default' : 'outline'}
          className={`h-7 px-2 text-xs ${
            peminjaman.status === 'Pending' 
              ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
              : 'border-yellow-500 text-yellow-600 hover:bg-yellow-50'
          }`}
          onClick={() => handleStatusClick('Pending')}
          disabled={isUpdating}
        >
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Button>
        
        <Button
          size="sm"
          variant={peminjaman.status === 'Ditolak' ? 'default' : 'outline'}
          className={`h-7 px-2 text-xs ${
            peminjaman.status === 'Ditolak' 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'border-red-600 text-red-600 hover:bg-red-50'
          }`}
          onClick={() => handleStatusClick('Ditolak')}
          disabled={isUpdating}
        >
          <X className="w-3 h-3 mr-1" />
          Tolak
        </Button>

        {peminjaman.status === 'Konflik' && (
          <Button
            size="sm"
            variant="default"
            className="h-7 px-2 text-xs bg-orange-500 hover:bg-orange-600 text-white cursor-default"
            disabled
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            Konflik
          </Button>
        )}
      </div>

      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingStatus === 'Ditolak' ? 'Alasan Penolakan' : 'Catatan Konflik'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="catatan">Catatan Admin (Opsional)</Label>
            <Textarea
              id="catatan"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Masukkan alasan atau catatan..."
              className="mt-2"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleConfirmWithNote}
              className={pendingStatus === 'Ditolak' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'}
            >
              Konfirmasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

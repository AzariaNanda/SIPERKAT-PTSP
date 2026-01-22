import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ResetPassword = () => {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validasi Input Dasar
    if (!password || !confirmPassword) {
      return toast.error("MOHON ISI SEMUA FIELD");
    }
    
    if (password.length < 6) {
      return toast.error("PASSWORD MINIMAL 6 KARAKTER");
    }
    
    if (password !== confirmPassword) {
      return toast.error("KONFIRMASI PASSWORD TIDAK COCOK");
    }

    // Mulai proses submisi
    setIsSubmitting(true);
    
    try {
      const { error } = await updatePassword(password);
      
      if (error) {
        toast.error("GAGAL RESET PASSWORD", { 
          description: error 
        });
        setIsSubmitting(false); // Hanya matikan loading jika gagal agar tombol tidak aktif lagi saat sukses
      } else {
        toast.success("BERHASIL!", { 
          description: "Password diperbarui. Mengalihkan ke login..." 
        });
        
        /**
         * PERBAIKAN: Jeda Navigasi
         * Memberikan waktu 1.5 detik agar listener onAuthStateChange di AuthContext 
         * selesai memproses sesi baru di latar belakang tanpa mem-block UI.
         */
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1500);
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem yang tidak terduga");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-none bg-white rounded-3xl overflow-hidden">
          <CardContent className="pt-12 pb-10 px-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                <KeyRound className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-800">Password Baru</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Masukan password baru yang aman</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500 tracking-wider">Password Baru</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    disabled={isSubmitting}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-2xl focus:bg-white transition-all font-medium disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500 tracking-wider">Konfirmasi Password</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    disabled={isSubmitting}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-2xl focus:bg-white transition-all font-medium disabled:opacity-50"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-14 font-black uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all rounded-2xl mt-4"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    MEMPROSES...
                  </span>
                ) : (
                  "UPDATE PASSWORD"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
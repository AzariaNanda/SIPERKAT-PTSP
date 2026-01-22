import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, ShieldQuestion, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validasi Sisi Klien (Input Kosong)
    if (!email) {
      return toast.error("INPUT DIPERLUKAN", {
        description: "Silakan masukkan email pegawai Anda terlebih dahulu."
      });
    }

    // 2. Validasi Format Email Sederhana
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return toast.error("FORMAT EMAIL SALAH", {
        description: "Pastikan format email sudah benar (contoh: nama@email.com)."
      });
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        // IDENTIFIKASI SUMBER MASALAH (ERROR HANDLING)
        let errorTitle = "GAGAL MENGIRIM LINK";
        let userFriendlyMsg = "Terjadi kendala saat menghubungi server.";

        // Analisis pesan error dari Supabase/Server
        if (error.toLowerCase().includes("rate limit") || error.includes("429")) {
          errorTitle = "BATAS PENGIRIMAN TERLAPAU";
          userFriendlyMsg = "Anda terlalu sering meminta link reset. Silakan tunggu beberapa menit lagi.";
        } else if (error.toLowerCase().includes("network") || error.toLowerCase().includes("fetch")) {
          errorTitle = "MASALAH KONEKSI";
          userFriendlyMsg = "Koneksi internet Anda terputus atau server sedang tidak stabil.";
        } else if (error.toLowerCase().includes("not found")) {
          errorTitle = "EMAIL TIDAK TERDAFTAR";
          userFriendlyMsg = "Email tersebut tidak ditemukan dalam sistem SIPERKAT.";
        }

        toast.error(errorTitle, { 
          description: userFriendlyMsg,
          icon: <AlertCircle className="w-5 h-5" />
        });

      } else {
        // SUKSES
        toast.success("LINK BERHASIL TERKIRIM!", { 
          description: "Segera cek kotak masuk atau folder Spam email Anda." 
        });
        setEmail(''); // Bersihkan input
      }
    } catch (err) {
      toast.error("KESALAHAN SISTEM", {
        description: "Terjadi kesalahan yang tidak terduga pada aplikasi."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-6 font-sans text-slate-900">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-none bg-white rounded-3xl overflow-hidden">
          <CardContent className="pt-12 pb-10 px-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
                <ShieldQuestion className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-800">Lupa Password?</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 leading-relaxed">
                Kami akan mengirimkan link pemulihan <br/> ke email terdaftar Anda.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500 tracking-wider px-1">Email Pegawai</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    disabled={isSubmitting}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-2xl focus:bg-white transition-all text-sm font-medium disabled:opacity-50"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-14 font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-[0.98] transition-all rounded-2xl"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    MEMPROSES...
                  </span>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Kirim Link Reset</>
                )}
              </Button>

              <Link 
                to="/" 
                className={`flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-widest mt-4 ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}
              >
                <ArrowLeft className="w-3 h-3" /> Kembali ke Login
              </Link>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
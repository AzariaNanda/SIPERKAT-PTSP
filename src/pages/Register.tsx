import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, AuthProvider } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const RegisterScreen = () => {
  const { signUp, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fungsi Validasi Mandiri
  const validateForm = () => {
    const { fullName, email, password, confirmPassword } = formData;

    // 1. Cek Field Kosong
    if (!fullName || !email || !password || !confirmPassword) {
      toast.error('Gagal', { description: 'Semua kolom wajib diisi!' });
      return false;
    }

    // 2. Validasi Nama
    if (fullName.length < 3) {
      toast.error('Nama Terlalu Pendek', { description: 'Nama lengkap minimal 3 karakter' });
      return false;
    }

    // 3. VALIDASI PASSWORD KETAT (Pusat Perbaikan)
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < 6) {
      toast.error('Password Lemah', { description: 'Minimal harus 6 karakter' });
      return false;
    }
    if (!hasNumber) {
      toast.error('Password Lemah', { description: 'Wajib mengandung minimal satu angka (0-9)' });
      return false;
    }
    if (!hasSymbol) {
      toast.error('Password Lemah', { description: 'Wajib mengandung karakter unik/simbol (@, #, !, dll)' });
      return false;
    }

    // 4. Cek Konfirmasi Password
    if (password !== confirmPassword) {
      toast.error('Tidak Cocok', { description: 'Konfirmasi password tidak sama dengan password' });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Jalankan validasi total
    if (!validateForm()) return;

    setIsSubmitting(true);

    const { error } = await signUp(formData.email, formData.password, formData.fullName);
    
    if (error) {
      toast.error('Registrasi Gagal', { description: error });
    } else {
      toast.success('Berhasil!', { 
        description: 'Akun dibuat. Silakan cek email untuk aktivasi OTP/Link.' 
      });
      // Redirect ke login setelah sukses
      setTimeout(() => navigate('/'), 2000);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-primary/20 flex items-center justify-center p-6 font-sans">
      <Card className="max-w-md w-full shadow-2xl border-none bg-white">
        <CardContent className="pt-10 pb-10 px-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Daftar Akun</h1>
            <p className="text-slate-500 text-sm mt-1">Sistem Peminjaman Terpadu (SIPERKAT)</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-bold uppercase text-slate-500">Nama Lengkap</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="fullName"
                  placeholder="Nama Lengkap sesuai NIP"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="pl-10 h-11 bg-slate-50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase text-slate-500">Email Pegawai</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="contoh@banyumaskab.go.id"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 h-11 bg-slate-50"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-bold uppercase text-slate-500">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 6 char"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 h-11 bg-slate-50 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase text-slate-500">Ulangi</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Ulangi password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-10 h-11 bg-slate-50 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Indikator Keamanan */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5" />
              <p className="text-[10px] text-blue-700 leading-tight">
                Gunakan minimal 6 karakter dengan kombinasi angka dan simbol (@#!) untuk keamanan akun.
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={loading || isSubmitting} 
              className="w-full h-12 text-base font-bold gap-2 shadow-lg shadow-primary/20 mt-2" 
            >
              {isSubmitting ? "Memproses..." : <><UserPlus className="w-5 h-5" />Buat Akun Sekarang</>}
            </Button>
          </form>
          
          <div className="mt-8 text-center pt-6 border-t border-slate-100">
            <p className="text-slate-400 text-xs mb-4 font-medium">Sudah memiliki akun?</p>
            <Link to="/">
              <Button variant="outline" className="gap-2 w-full h-11 border-slate-200 font-bold text-slate-700">
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Register = () => (
  <AuthProvider>
    <RegisterScreen />
  </AuthProvider>
);

export default Register;

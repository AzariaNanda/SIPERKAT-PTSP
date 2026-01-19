import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, ArrowLeft } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { fullName, email, password, confirmPassword } = formData;

    if (!fullName || !email || !password || !confirmPassword) {
      toast.error('Mohon lengkapi semua field');
      return;
    }

    if (fullName.length < 3) {
      toast.error('Nama lengkap minimal 3 karakter');
      return;
    }

    if (password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Password dan konfirmasi password tidak cocok');
      return;
    }

    setIsSubmitting(true);

    const { error } = await signUp(email, password, fullName);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Registrasi berhasil! Selamat datang.');
      navigate('/');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-600 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl border-0">
        <CardContent className="pt-8 pb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-4 shadow-lg">
              <UserPlus className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Daftar Akun</h1>
            <p className="text-muted-foreground">SIPERKAT - DPMPTSP Kab. Banyumas</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Masukkan email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Ulangi password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading || isSubmitting} 
              className="w-full h-12 text-lg font-semibold gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" 
              size="lg"
            >
              {isSubmitting ? (
                <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>Memproses...</>
              ) : (
                <><UserPlus className="w-5 h-5" />Daftar</>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-muted-foreground mb-4">Sudah punya akun?</p>
            <Link to="/">
              <Button variant="outline" className="gap-2 w-full">
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Login
              </Button>
            </Link>
          </div>

          <div className="mt-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
            <p className="text-sm text-teal-800 text-center">
              🔒 Setelah mendaftar, Anda akan otomatis login sebagai pengguna biasa.
              Admin dapat mengubah role Anda jika diperlukan.
            </p>
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

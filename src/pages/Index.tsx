import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Car, Home, Send, History, Download, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Navbar } from '@/components/layout/Navbar';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { KendaraanManagement } from '@/components/admin/KendaraanManagement';
import { RuanganManagement } from '@/components/admin/RuanganManagement';
import { PengajuanManagement } from '@/components/admin/PengajuanManagement';
import { PeminjamanForm } from '@/components/user/PeminjamanForm';
import { RiwayatPeminjaman } from '@/components/user/RiwayatPeminjaman';
import { useAuth, AuthProvider } from '@/contexts/AuthContext';
import { usePeminjaman } from '@/hooks/usePeminjaman';
import { exportKendaraanData, exportRuanganData } from '@/utils/exportSeparated';
import { toast } from 'sonner';

const LoginScreen = () => {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Mohon isi email dan password');
      return;
    }

    if (password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    setIsSubmitting(true);

    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Login berhasil!');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl">
        <CardContent className="pt-8 pb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
              <Car className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-primary mb-2">SIPERKAT</h1>
            <p className="text-foreground font-semibold">Sistem Peminjaman Terpadu</p>
            <p className="text-sm text-muted-foreground mt-2">DPMPTSP Kabupaten Banyumas</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Masukkan email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading || isSubmitting} 
              className="w-full h-12 text-lg font-semibold gap-2" 
              size="lg"
            >
              {isSubmitting ? (
                <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>Memproses...</>
              ) : (
                <><LogIn className="w-5 h-5" />Login</>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-muted-foreground mb-4">Belum punya akun?</p>
            <Link to="/register">
              <Button variant="outline" className="gap-2 w-full">
                <UserPlus className="w-4 h-4" />
                Daftar Sekarang
              </Button>
            </Link>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 text-center">
              🔐 Semua pengguna baru akan otomatis mendapatkan akses sebagai User.
              Hubungi admin untuk perubahan role.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const MainApp = () => {
  const { isAdmin, loading } = useAuth();
  const { peminjamanList } = usePeminjaman(isAdmin);
  const [activeTab, setActiveTab] = useState('dashboard');
  const currentYear = new Date().getFullYear();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <WhatsAppButton />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {isAdmin ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="dashboard" className="gap-2"><LayoutDashboard className="w-4 h-4" />Dashboard</TabsTrigger>
                <TabsTrigger value="pengajuan" className="gap-2"><ClipboardList className="w-4 h-4" />Pengajuan</TabsTrigger>
                <TabsTrigger value="kendaraan" className="gap-2"><Car className="w-4 h-4" />Kendaraan</TabsTrigger>
                <TabsTrigger value="ruangan" className="gap-2"><Home className="w-4 h-4" />Ruangan</TabsTrigger>
              </TabsList>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => exportKendaraanData(peminjamanList, currentYear)} className="gap-2">
                  <Download className="w-4 h-4" />Export Kendaraan
                </Button>
                <Button variant="outline" onClick={() => exportRuanganData(peminjamanList, currentYear)} className="gap-2">
                  <Download className="w-4 h-4" />Export Ruangan
                </Button>
              </div>
            </div>
            <TabsContent value="dashboard"><Dashboard isAdmin={true} /></TabsContent>
            <TabsContent value="pengajuan"><PengajuanManagement /></TabsContent>
            <TabsContent value="kendaraan"><KendaraanManagement /></TabsContent>
            <TabsContent value="ruangan"><RuanganManagement /></TabsContent>
          </Tabs>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="dashboard" className="gap-2"><LayoutDashboard className="w-4 h-4" />Dashboard</TabsTrigger>
              <TabsTrigger value="ajukan" className="gap-2"><Send className="w-4 h-4" />Ajukan</TabsTrigger>
              <TabsTrigger value="riwayat" className="gap-2"><History className="w-4 h-4" />Riwayat</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard"><Dashboard isAdmin={false} /></TabsContent>
            <TabsContent value="ajukan"><PeminjamanForm /></TabsContent>
            <TabsContent value="riwayat"><RiwayatPeminjaman /></TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

const Index = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;
  }

  return user ? <MainApp /> : <LoginScreen />;
};

const IndexWrapper = () => (
  <AuthProvider>
    <Index />
  </AuthProvider>
);

export default IndexWrapper;

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, ClipboardList, Car, Home, Send, History, 
  Download, Mail, Lock, LogIn, UserPlus, DoorOpen, CheckCircle2, Shield, Building2 
} from 'lucide-react';
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

const ALLOWED_EMAILS = [
  "subbagumpeg.dpmptspbms@gmail.com",
  "dpmpptspkabbanyumas@gmail.com",
];

const features = [
  {
    icon: Car,
    title: "Peminjaman Kendaraan",
    description: "Booking kendaraan dinas dengan mudah",
  },
  {
    icon: DoorOpen,
    title: "Reservasi Ruang Rapat",
    description: "Jadwalkan meeting tanpa bentrok",
  },
  {
    icon: CheckCircle2,
    title: "Approval Digital",
    description: "Persetujuan cepat dan transparan",
  },
  {
    icon: Shield,
    title: "Terintegrasi Kalender",
    description: "Sync otomatis dengan Google Calendar",
  },
];

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
    if (!ALLOWED_EMAILS.includes(email)) {
      toast.error('Akses Ditolak', {
        description: 'Email Anda tidak terdaftar dalam sistem internal SIPERKAT.',
      });
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
    <div className="min-h-screen grid lg:grid-cols-2 overflow-hidden bg-white font-sans text-slate-900">
      {/* SISI KIRI: BRANDING & FEATURES */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#1e3a8a] p-16 text-white relative">
        <div className="relative z-10">
          {/* Header Logo */}
          <div className="flex items-center gap-4 mb-16">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight uppercase">SIPERKAT</h1>
              <p className="text-white/50 text-[10px] tracking-[0.2em] uppercase font-medium">DPMPTSP Kabupaten Banyumas</p>
            </div>
          </div>
          
          {/* Teks Utama (Leading diatur agar tidak terlalu renggang) */}
          <div className="mb-8">
            <h2 className="text-[48px] font-bold leading-[1.15] tracking-tight mb-3">
              Sistem Peminjaman <br />
              Kendaraan & Ruang <br />
              Rapat Terpadu
            </h2>
            <p className="text-lg text-white/60 leading-relaxed max-w-md font-normal">
              Platform digital untuk mengelola peminjaman aset kantor dengan efisien, transparan, dan terintegrasi.
            </p>
          </div>
          
          {/* Fitur Grid */}
          <div className="grid grid-cols-2 gap-5 mt-12">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-sm hover:bg-white/10 transition-all"
              >
                <feature.icon className="w-6 h-6 mb-3 text-blue-400" />
                <h3 className="font-bold text-sm mb-1 uppercase tracking-wide">{feature.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* COPYRIGHT: BAWAH KIRI DENGAN SPASI IDEAL */}
        <div className="relative z-10 text-[10px] font-bold uppercase tracking-[0.25em] text-white/20 text-left">
          © 2026 DPMPTSP Kabupaten Banyumas
        </div>

        {/* Dekorasi Cahaya Biru Tua (Tidak terlalu terang) */}
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-900/20 rounded-full blur-[120px]" />
      </div>

      {/* SISI KANAN: FORM LOGIN */}
      <div className="flex items-center justify-center p-8 bg-slate-50/50">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-none bg-white">
            <CardContent className="pt-10 pb-10 px-10">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-5">
                  <Car className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-primary mb-1">SIPERKAT</h1>
                <p className="text-slate-600 font-semibold text-sm uppercase tracking-wide">Sistem Peminjaman Terpadu</p>
                <p className="text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-widest">Layanan Internal Satu Pintu</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-bold text-xs uppercase text-slate-500 tracking-wider">Email Pegawai</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all text-sm"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" name="password" className="font-bold text-xs uppercase text-slate-500 tracking-wider">Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 bg-slate-50 border-slate-200 focus:bg-white transition-all text-sm"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || isSubmitting} 
                  className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 mt-4 active:scale-[0.98] transition-all" 
                >
                  {isSubmitting ? "Memproses..." : <><LogIn className="w-5 h-5 mr-2" />Masuk Sistem</>}
                </Button>
              </form>
              
              <div className="mt-10 text-center pt-8 border-t border-slate-100">
                <p className="text-slate-400 text-xs mb-3 font-medium tracking-wide">Belum memiliki akses?</p>
                <Link to="/register">
                  <Button variant="outline" className="w-full h-11 font-bold border-slate-200 hover:bg-slate-50 text-slate-700 text-xs">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Daftar Sekarang
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ... (Bagian MainApp, Index, dan Wrapper tetap sama seperti sebelumnya)
const MainApp = () => {
  const { isAdmin, loading } = useAuth();
  const { peminjamanList } = usePeminjaman(isAdmin);
  const [activeTab, setActiveTab] = useState('dashboard');
  const currentYear = new Date().getFullYear();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
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
                <Button variant="outline" onClick={() => exportKendaraanData(peminjamanList, currentYear)} className="gap-2 h-9 text-xs">
                  <Download className="w-4 h-4" />Export Kendaraan
                </Button>
                <Button variant="outline" onClick={() => exportRuanganData(peminjamanList, currentYear)} className="gap-2 h-9 text-xs">
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
  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-primary animate-pulse tracking-widest uppercase">SIPERKAT</div>;
  return user ? <MainApp /> : <LoginScreen />;
};

const IndexWrapper = () => (
  <AuthProvider>
    <Index />
  </AuthProvider>
);

export default IndexWrapper;

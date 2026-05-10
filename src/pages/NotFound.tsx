import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 px-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-[120px] font-black leading-none text-primary/10 select-none">
          404
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-800">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Halaman yang Anda cari tidak ada atau telah dipindahkan.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild className="gap-2 font-black uppercase tracking-widest text-xs h-11 px-8 rounded-xl shadow-lg shadow-primary/20">
            <Link to="/">
              <Home className="w-4 h-4" />
              Kembali ke Beranda
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="gap-2 font-black uppercase tracking-widest text-xs h-11 px-8 rounded-xl border-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Halaman Sebelumnya
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
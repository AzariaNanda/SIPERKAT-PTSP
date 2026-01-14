import { Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface LoginPageProps {
  onLogin: () => void;
  loading: boolean;
}

export const LoginPage = ({ onLogin, loading }: LoginPageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl border-0">
        <CardContent className="pt-8 pb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
              <Car className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-primary mb-2">SIPERKAT</h1>
            <p className="text-foreground font-semibold">Sistem Peminjaman Terpadu</p>
            <p className="text-sm text-muted-foreground mt-2">DPMPTSP Kabupaten Banyumas</p>
          </div>
          
          <Button
            onClick={onLogin}
            disabled={loading}
            className="w-full h-14 text-lg font-semibold gap-3"
            size="lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                Memproses...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Login dengan Google
              </>
            )}
          </Button>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              <span className="font-semibold">Akses Terbatas:</span> Hanya pegawai DPMPTSP yang terdaftar yang dapat mengakses sistem ini.
            </p>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Hubungi administrator jika Anda memerlukan akses.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

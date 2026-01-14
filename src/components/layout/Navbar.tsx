import { Car, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LiveClock } from './LiveClock';
import { useAuth } from '@/contexts/AuthContext';

export const Navbar = () => {
  const { isAdmin, signOut } = useAuth();

  return (
    <nav className="bg-primary text-primary-foreground shadow-xl">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Car className="w-10 h-10" />
            <div>
              <h1 className="text-2xl font-bold">SIPERKAT</h1>
              <p className="text-sm text-primary-foreground/80">
                {isAdmin ? 'Administrator Panel' : 'User Dashboard'} • DPMPTSP Banyumas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <LiveClock />
            <Button
              onClick={signOut}
              variant="secondary"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

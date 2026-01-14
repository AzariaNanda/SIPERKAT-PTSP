import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AppRole = 'admin' | 'user' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Allowed emails
const ADMIN_EMAIL = 'subbagumpeg.dpmptspbms@gmail.com';
const USER_EMAIL = 'dpmpptspkabbanyumas@gmail.com';
const ALLOWED_EMAILS = [ADMIN_EMAIL, USER_EMAIL];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_user_role', { _user_id: userId });
      if (error) {
        console.error('Error fetching role:', error);
        return null;
      }
      return data as AppRole;
    } catch (err) {
      console.error('Error in fetchUserRole:', err);
      return null;
    }
  };

  const checkAndSignOutUnauthorized = async (email: string | undefined) => {
    if (!email || !ALLOWED_EMAILS.includes(email)) {
      toast.error('Akses Ditolak. Email tidak terdaftar dalam sistem.');
      await supabase.auth.signOut();
      return true;
    }
    return false;
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(async () => {
            const unauthorized = await checkAndSignOutUnauthorized(session.user.email);
            if (!unauthorized) {
              const userRole = await fetchUserRole(session.user.id);
              setRole(userRole);
            }
            setLoading(false);
          }, 0);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const unauthorized = await checkAndSignOutUnauthorized(session.user.email);
        if (!unauthorized) {
          const userRole = await fetchUserRole(session.user.id);
          setRole(userRole);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    // Check if email is allowed
    if (!ALLOWED_EMAILS.includes(email)) {
      return { error: 'Akses Ditolak. Email tidak terdaftar dalam sistem.' };
    }

    // Try real authentication
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message === 'Invalid login credentials') {
        return { error: 'Email atau password salah' };
      }
      return { error: error.message };
    }

    return { error: null };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Gagal logout: ' + error.message);
    } else {
      setUser(null);
      setSession(null);
      setRole(null);
      toast.success('Logout berhasil');
    }
  };

  const value: AuthContextType = {
    user,
    session,
    role,
    isAdmin: role === 'admin',
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

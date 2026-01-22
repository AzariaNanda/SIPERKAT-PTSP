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
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string): Promise<AppRole> => {
    try {
      const { data, error } = await supabase.rpc('get_user_role', { _user_id: userId });
      if (error) return 'user';
      return (data as AppRole) || 'user';
    } catch (err) {
      return 'user';
    }
  };

  useEffect(() => {
    // 1. Inisialisasi Session Awal
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const userRole = await fetchUserRole(session.user.id);
          setRole(userRole);
        }
      } catch (error) {
        console.error("Auth init error:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 2. Listener Perubahan Status Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (session?.user) {
          // Ambil role secara asinkron tanpa mem-block setLoading
          fetchUserRole(session.user.id).then((userRole) => {
            setRole(userRole);
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setRole(null);
      }

      /**
       * PERBAIKAN UTAMA: 
       * Jangan biarkan loading tetap true saat proses pemulihan password.
       * Ini mencegah aplikasi hang saat user berada di halaman Reset Password.
       */
      if (event === 'PASSWORD_RECOVERY') {
        setLoading(false);
      }
      
      // Pastikan loading dimatikan jika session sudah diproses
      if (event === 'SIGNED_OUT' || !session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message === 'Invalid login credentials' ? 'Email atau password salah' : error.message };
    }
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName } 
      }
    });
    return { error: error ? error.message : null };
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error ? error.message : null };
  };

  const updatePassword = async (newPassword: string): Promise<{ error: string | null }> => {
    // Gunakan fungsi updateUser dari Supabase Auth
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) return { error: error.message };
    
    // Opsional: Sign out setelah ganti password agar user login ulang dengan kredensial baru
    // atau biarkan session tetap aktif.
    return { error: null };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setRole(null);
      toast.success('LOGOUT BERHASIL');
    } catch (error) {
      console.error("Signout error:", error);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    role,
    isAdmin: role === 'admin',
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
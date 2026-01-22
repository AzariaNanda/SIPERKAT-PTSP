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

  // Helper: Cek apakah email masih terdaftar di whitelist
  const checkAccess = async (email: string | undefined) => {
    if (!email) return false;
    const { data: isAllowed } = await supabase.rpc('check_whitelist_email', { 
      _email: email.toLowerCase().trim() 
    });
    return !!isAllowed;
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // PERBAIKAN: Jika user sudah login tapi email dihapus admin, paksa logout
          const isAllowed = await checkAccess(session.user.email);
          if (!isAllowed) {
            await supabase.auth.signOut();
            setUser(null);
            setRole(null);
            return;
          }

          const userRole = await fetchUserRole(session.user.id);
          setRole(userRole);
        }
        setSession(session);
        setUser(session?.user ?? null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // PERBAIKAN: Cek akses setiap kali ada perubahan status/refresh
        const isAllowed = await checkAccess(session.user.email);
        if (!isAllowed) {
          if (event !== 'SIGNED_OUT') {
            toast.error("Akses Anda telah dicabut.");
            await supabase.auth.signOut();
          }
          setUser(null);
          setRole(null);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session.user);
        fetchUserRole(session.user.id).then(setRole);
      } else {
        setSession(null);
        setUser(null);
        setRole(null);
      }

      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || !session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const cleanEmail = email.toLowerCase().trim();
    
    // Cek whitelist sebelum login
    const isAllowed = await checkAccess(cleanEmail);
    if (!isAllowed) return { error: "Email Anda tidak terdaftar dalam sistem." };

    const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error) {
      const msg = error.message === 'Invalid login credentials' ? 'Email atau password salah' : error.message;
      return { error: msg };
    }
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string): Promise<{ error: string | null }> => {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const { data: isWhitelisted, error: checkError } = await supabase.rpc('check_whitelist_email', { 
        _email: cleanEmail 
      });

      if (checkError) return { error: "Gagal verifikasi database." };
      if (!isWhitelisted) return { error: "Email belum terdaftar dalam database pegawai." };

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { 
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: fullName } 
        }
      });

      if (signUpError) return { error: signUpError.message };

      // SINKRONISASI STATUS: Otomatis Aktif setelah pendaftaran
      if (authData.user) {
        await supabase.from('pegawai_whitelist').update({ is_registered: true }).eq('email', cleanEmail);
      }

      return { error: null };
    } catch (err: any) {
      return { error: "Terjadi kesalahan sistem pendaftaran." };
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error ? error.message : null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error ? error.message : null };
  };

  const signOut = async () => {
    try { await supabase.auth.signOut(); } catch (e) {}
    setUser(null);
    setSession(null);
    setRole(null);
    toast.success('LOGOUT BERHASIL');
  };

  const value = { user, session, role, isAdmin: role === 'admin', loading, signIn, signUp, signOut, resetPassword, updatePassword };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
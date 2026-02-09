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

// Daftar email eksklusif yang SELALU diizinkan.
const ALWAYS_ALLOWED_EMAILS = [
  'subbagumpeg.dpmptspbms@gmail.com',
  'dpmpptspkabbanyumas@gmail.com',
];

// Durasi timeout 5 detik agar lebih stabil 
const AUTH_TIMEOUT = 5000; 

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);

  const withTimeout = async <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
    let timeoutId: number | undefined;
    const timeout = new Promise<T>((resolve) => {
      timeoutId = window.setTimeout(() => resolve(fallback), ms);
    });
    try {
      return await Promise.race([promise, timeout]);
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
    }
  };

  const fetchUserRole = async (userId: string): Promise<AppRole> => {
    try {
      const { data, error } = await supabase.rpc('get_user_role', { _user_id: userId });
      if (error) return 'user';
      return (data as AppRole) || 'user';
    } catch (err) {
      return 'user';
    }
  };

  const verifyWhitelist = async (email: string | undefined) => {
    if (!email) return false;

    // Email khusus tidak perlu cek RPC
    const cleanEmail = email.toLowerCase().trim();
    if (ALWAYS_ALLOWED_EMAILS.includes(cleanEmail)) {
      return true;
    }

    try {
      const { data: isWhitelisted } = await supabase.rpc('check_whitelist_email', {
        _email: cleanEmail
      });
      return !!isWhitelisted;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (currentSession?.user) {
          const email = currentSession.user.email;
          const userId = currentSession.user.id;

          // Verifikasi dengan timeout (5 detik)
          const [isAllowed, userRole] = await Promise.all([
            withTimeout(verifyWhitelist(email), AUTH_TIMEOUT, false),
            withTimeout(fetchUserRole(userId), AUTH_TIMEOUT, 'user' as AppRole),
          ]);

          if (!isAllowed) {
            // Jika timeout atau tidak terdaftar, paksa logout untuk kembali ke login
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setRole(null);
            toast.error("Sesi tidak valid atau koneksi timeout. Silakan login kembali.");
          } else {
            setSession(currentSession);
            setUser(currentSession.user);
            setRole(userRole || 'user');
          }
        } else {
          setSession(null);
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error("Auth Init Error:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (currentSession?.user) {
        const email = currentSession.user.email;
        const userId = currentSession.user.id;

        const [isAllowed, userRole] = await Promise.all([
          withTimeout(verifyWhitelist(email), AUTH_TIMEOUT, false),
          withTimeout(fetchUserRole(userId), AUTH_TIMEOUT, 'user' as AppRole),
        ]);

        if (!isAllowed) {
          if (event !== 'SIGNED_OUT') {
            toast.error("Akses Ditolak atau Sesi Habis. Silakan login kembali.");
            await supabase.auth.signOut();
          }
          setUser(null);
          setSession(null);
          setRole(null);
          setLoading(false);
          return;
        }

        setSession(currentSession);
        setUser(currentSession.user);
        setRole(userRole || 'user');
        setLoading(false);
        return;
      }

      setSession(null);
      setUser(null);
      setRole(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const cleanEmail = email.toLowerCase().trim();
      
      // AUTH_TIMEOUT yang lebih panjang untuk cek whitelist
      const isAllowed = await withTimeout(verifyWhitelist(cleanEmail), AUTH_TIMEOUT, false);

      if (!isAllowed) return { error: "Email Anda tidak terdaftar atau koneksi lambat." };

      const result = await withTimeout(
        supabase.auth.signInWithPassword({ email: cleanEmail, password }),
        15000, // Timeout login 15 detik untuk stabilitas
        { data: { user: null, session: null }, error: { message: 'TIMEOUT' } as any }
      );

      const error = (result as any)?.error;
      if (error) {
        const raw = String(error.message || 'Terjadi kesalahan');
        const msg = raw === 'Invalid login credentials'
          ? 'Email atau password salah'
          : raw === 'TIMEOUT'
            ? 'Koneksi lambat. Silakan coba lagi.'
            : raw;
        return { error: msg };
      }

      return { error: null };
    } catch (e: any) {
      return { error: 'Terjadi kesalahan login. Silakan coba lagi.' };
    }
  };

  const signUp = async (email: string, password: string, fullName: string): Promise<{ error: string | null }> => {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const isAllowed = await verifyWhitelist(cleanEmail);

      if (!isAllowed) return { error: "Email belum terdaftar dalam tabel pegawai. Silahkan hubungi admin." };

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { 
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: fullName } 
        }
      });

      if (signUpError) return { error: signUpError.message };

      if (authData.user) {
        await supabase.from('pegawai_whitelist').update({ is_registered: true }).eq('email', cleanEmail);
      }

      return { error: null };
    } catch (err: any) {
      return { error: "Terjadi kesalahan pendaftaran." };
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
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

// Daftar email eksklusif yang SELALU diizinkan (tidak bergantung pada RPC whitelist).
const ALWAYS_ALLOWED_EMAILS = [
  'subbagumpeg.dpmptspbms@gmail.com',
  'dpmpptspkabbanyumas@gmail.com',
];

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

    // Exception: email khusus langsung lolos (tidak perlu cek RPC)
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

        // Matikan loading secepat mungkin setelah status dasar auth diketahui.
        // Role/whitelist akan disinkronkan secara async tanpa menahan UI.
        setLoading(false);

        if (currentSession?.user) {
          const email = currentSession.user.email;
          const userId = currentSession.user.id;

          // Jalankan whitelist check & fetch role secara paralel.
          // Jika RPC lambat, default aman: whitelist=false, role='user'.
          const [isAllowed, userRole] = await Promise.all([
            withTimeout(verifyWhitelist(email), 3500, false),
            withTimeout(fetchUserRole(userId), 3500, 'user' as AppRole),
          ]);

          if (!isAllowed) {
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setRole(null);
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
        // Pertahankan safety: jangan biarkan loading menggantung.
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      // Pastikan UI tidak tertahan (role/whitelist sinkron async)
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || !currentSession) {
        setLoading(false);
      }

      if (currentSession?.user) {
        const email = currentSession.user.email;
        const userId = currentSession.user.id;

        const [isAllowed, userRole] = await Promise.all([
          withTimeout(verifyWhitelist(email), 3500, false),
          withTimeout(fetchUserRole(userId), 3500, 'user' as AppRole),
        ]);

        if (!isAllowed) {
          if (event !== 'SIGNED_OUT') {
            toast.error("Akses Ditolak. Akun Anda tidak terdaftar.");
            await supabase.auth.signOut();
          }
          setUser(null);
          setSession(null);
          setRole(null);
          return;
        }

        setSession(currentSession);
        setUser(currentSession.user);
        setRole(userRole || 'user');
        return;
      }

      setSession(null);
      setUser(null);
      setRole(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const cleanEmail = email.toLowerCase().trim();

      // Hindari UI hang bila RPC whitelist lambat: fallback aman = ditolak.
      const isAllowed = await withTimeout(verifyWhitelist(cleanEmail), 3500, false);

      if (!isAllowed) return { error: "Email Anda tidak terdaftar dalam database pegawai." };

      // Hindari "Memproses..." tanpa akhir bila request auth bermasalah
      const result = await withTimeout(
        supabase.auth.signInWithPassword({ email: cleanEmail, password }),
        8000,
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

      if (!isAllowed) return { error: "Email Anda belum didaftarkan oleh Admin." };

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { 
          emailRedirectTo: `${window.location.origin}/`,
          data: { full_name: fullName } 
        }
      });

      if (signUpError) return { error: signUpError.message };

      // REVISI: Status berubah jadi 'Aktif' (is_registered: true) HANYA setelah sukses daftar
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
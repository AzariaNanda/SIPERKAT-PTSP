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

const ALWAYS_ALLOWED_EMAILS = [
  'subbagumpeg.dpmptspbms@gmail.com',
  'dpmpptspkabbanyumas@gmail.com',
];

const AUTH_TIMEOUT = 5000; 

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);

  // Helper timeout
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
    const cleanEmail = email.toLowerCase().trim();
    if (ALWAYS_ALLOWED_EMAILS.includes(cleanEmail)) return true;

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
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        // --- OPTIMISTIC LOGIN START ---
        // Cek apakah ada cache role di LocalStorage biar gak nunggu loading
        const cachedRole = localStorage.getItem('siperkat_role') as AppRole;
        
        if (currentSession?.user && cachedRole) {
           // Jika ada session & cache, LANGSUNG BUKA UI (Jangan tunggu RPC)
           if (mounted) {
             setSession(currentSession);
             setUser(currentSession.user);
             setRole(cachedRole);
             setLoading(false); // Tampilan sudah siap
           }
        }
        // --- OPTIMISTIC LOGIN END ---

        if (currentSession?.user) {
          const email = currentSession.user.email;
          const userId = currentSession.user.id;

          // Verifikasi ke server (Background process jika cache ada)
          const [isAllowed, userRole] = await Promise.all([
            withTimeout(verifyWhitelist(email), AUTH_TIMEOUT, false),
            withTimeout(fetchUserRole(userId), AUTH_TIMEOUT, 'user' as AppRole),
          ]);

          if (mounted) {
            if (!isAllowed) {
              // Kalau ternyata server bilang TIDAK BOLEH, baru user dikeluarkan
              setUser(null);
              setSession(null);
              setRole(null);
              localStorage.removeItem('siperkat_role'); // Hapus cache
              setLoading(false);
              await supabase.auth.signOut().catch(() => {});
              toast.error("Sesi tidak valid. Silakan login kembali.");
            } else {
              // Kalau server setuju, update state (sinkronisasi)
              setSession(currentSession);
              setUser(currentSession.user);
              setRole(userRole || 'user');
              
              // SIMPAN CACHE TERBARU
              localStorage.setItem('siperkat_role', userRole || 'user');
              
              // Jika tadi belum loading false 
              setLoading(false);
            }
          }
        } else if (mounted) {
          setSession(null);
          setUser(null);
          setRole(null);
          localStorage.removeItem('siperkat_role');
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth Init Error:", error);
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      try {
        if (currentSession?.user) {
          const email = currentSession.user.email;
          const userId = currentSession.user.id;

          // Cek cache dulu untuk responsivitas saat tab switch/refocus
          const cachedRole = localStorage.getItem('siperkat_role') as AppRole;
          if (mounted && cachedRole && loading) {
             setRole(cachedRole);
             setUser(currentSession.user);
             setSession(currentSession);
             setLoading(false);
          }

          const [isAllowed, userRole] = await Promise.all([
            withTimeout(verifyWhitelist(email), AUTH_TIMEOUT, false),
            withTimeout(fetchUserRole(userId), AUTH_TIMEOUT, 'user' as AppRole),
          ]);

          if (!isAllowed) {
            if (mounted) {
              setUser(null);
              setSession(null);
              setRole(null);
              setLoading(false);
              localStorage.removeItem('siperkat_role');
            }
            if (event !== 'SIGNED_OUT') {
              toast.error("Akses dicabut atau sesi habis.");
              await supabase.auth.signOut().catch(() => {});
            }
            return;
          }

          if (mounted) {
            setSession(currentSession);
            setUser(currentSession.user);
            setRole(userRole || 'user');
            localStorage.setItem('siperkat_role', userRole || 'user'); // Update cache
            setLoading(false);
          }
          return;
        }

        // Logout Flow
        if (mounted) {
          setSession(null);
          setUser(null);
          setRole(null);
          localStorage.removeItem('siperkat_role'); // Bersihkan cache saat logout
          setLoading(false);
        }
      } catch (err) {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const isAllowed = await withTimeout(verifyWhitelist(cleanEmail), AUTH_TIMEOUT, false);

      if (!isAllowed) return { error: "Email Anda tidak terdaftar." };

      const result = await withTimeout(
        supabase.auth.signInWithPassword({ email: cleanEmail, password }),
        15000, 
        { data: { user: null, session: null }, error: { message: 'TIMEOUT' } as any }
      );

      const error = (result as any)?.error;
      if (error) {
        const raw = String(error.message || 'Terjadi kesalahan');
        return { error: raw === 'TIMEOUT' ? 'Koneksi lambat.' : 'Email atau password salah' };
      }
      
      return { error: null };
    } catch (e: any) {
      return { error: 'Terjadi kesalahan login.' };
    }
  };

  const signUp = async (email: string, password: string, fullName: string): Promise<{ error: string | null }> => {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const isAllowed = await verifyWhitelist(cleanEmail);

      if (!isAllowed) return { error: "Email belum terdaftar (Whitelist)." };

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
    // 1. Bersihkan UI & Cache Instan
    setUser(null);
    setSession(null);
    setRole(null);
    localStorage.removeItem('siperkat_role'); // HAPUS CACHE PENTING
    
    // 2. Lapor server background
    try { await supabase.auth.signOut(); } catch (e) {}
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
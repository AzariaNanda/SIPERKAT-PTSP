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

  // Fungsi untuk mengambil role dari tabel user_roles
  const fetchUserRole = async (userId: string): Promise<AppRole> => {
    try {
      const { data, error } = await supabase.rpc('get_user_role', { _user_id: userId });
      if (error) return 'user';
      return (data as AppRole) || 'user';
    } catch (err) {
      return 'user';
    }
  };

  // Fungsi Verifikasi Whitelist (Security Guard)
  const verifyWhitelist = async (email: string | undefined) => {
    if (!email) return false;
    try {
      const { data: isWhitelisted } = await supabase.rpc('check_whitelist_email', { 
        _email: email.toLowerCase().trim() 
      });
      return !!isWhitelisted;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    let roleSubscription: any = null;

    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        console.log('[Auth] initAuth:getSession', {
          hasSession: !!currentSession,
          hasUser: !!currentSession?.user,
          email: currentSession?.user?.email,
        });
        
        if (currentSession?.user) {
          const isAllowed = await verifyWhitelist(currentSession.user.email);

          console.log('[Auth] initAuth:verifyWhitelist', {
            email: currentSession.user.email,
            isAllowed,
          });
          
          if (!isAllowed) {
            await supabase.auth.signOut();
            handleClearAuth();
          } else {
            const userRole = await fetchUserRole(currentSession.user.id);

            console.log('[Auth] initAuth:fetchUserRole', {
              userId: currentSession.user.id,
              role: userRole,
            });

            setSession(currentSession);
            setUser(currentSession.user);
            setRole(userRole);
            setupRoleRealtime(currentSession.user.id);
          }
        }
      } catch (error) {
        console.error("Auth Init Error:", error);
      } finally {
        // Selalu hentikan loading agar app tidak stuck di splash screen
        setLoading(false);
      }
    };

    // Fungsi untuk memantau perubahan role secara LIVE
    const setupRoleRealtime = (userId: string) => {
      if (roleSubscription) roleSubscription.unsubscribe();

      roleSubscription = supabase
        .channel('public:user_roles')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'user_roles', filter: `user_id=eq.${userId}` },
          (payload) => {
            const newRole = payload.new.role as AppRole;
            setRole(newRole);
            toast.info(`Hak akses Anda telah diperbarui menjadi: ${newRole?.toUpperCase()}`);
          }
        )
        .subscribe();
    };

    const handleClearAuth = () => {
      setSession(null);
      setUser(null);
      setRole(null);
      if (roleSubscription) roleSubscription.unsubscribe();
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('[Auth] onAuthStateChange', {
        event,
        hasSession: !!currentSession,
        hasUser: !!currentSession?.user,
        email: currentSession?.user?.email,
      });

      try {
        if (currentSession?.user) {
          // Urutan wajib: cek sesi -> whitelist -> role -> stop loading
          const isAllowed = await verifyWhitelist(currentSession.user.email);

          console.log('[Auth] onAuthStateChange:verifyWhitelist', {
            email: currentSession.user.email,
            isAllowed,
          });
          
          if (!isAllowed) {
            if (event !== 'SIGNED_OUT') {
              toast.error("Akses Ditolak. Email Anda tidak terdaftar.");
              await supabase.auth.signOut();
            }
            handleClearAuth();
          } else {
            setSession(currentSession);
            setUser(currentSession.user);
            const userRole = await fetchUserRole(currentSession.user.id);

            console.log('[Auth] onAuthStateChange:fetchUserRole', {
              userId: currentSession.user.id,
              role: userRole,
            });

            setRole(userRole);
            setupRoleRealtime(currentSession.user.id);
          }
        } else {
          handleClearAuth();
        }
      } catch (err) {
        console.error('[Auth] onAuthStateChange error', err);
      } finally {
        // KRITIS: selalu hentikan loading (termasuk event INITIAL_SESSION)
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (roleSubscription) roleSubscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const cleanEmail = email.toLowerCase().trim();
    const isAllowed = await verifyWhitelist(cleanEmail);
    
    if (!isAllowed) return { error: "Email Anda tidak terdaftar dalam database pimpinan." };

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

      // REVISI: Status 'Aktif' (true) hanya terjadi saat signUp sukses
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
    setSession(null);
    setUser(null);
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
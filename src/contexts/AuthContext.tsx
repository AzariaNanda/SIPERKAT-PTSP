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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string): Promise<AppRole> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      if (error || !data) return 'user';
      return (data.role as AppRole) || 'user';
    } catch (err) {
      return 'user';
    }
  };

  const verifyWhitelist = async (email: string | undefined) => {
    if (!email) return false;
    const cleanEmail = email.toLowerCase().trim();
    if (ALWAYS_ALLOWED_EMAILS.includes(cleanEmail)) return true;

    try {
      const { data, error } = await supabase
        .from('pegawai_whitelist')
        .select('email')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (error) return false;
      return !!data;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession?.user) {
          const email = currentSession.user.email;
          const userId = currentSession.user.id;

          // Cek akses & role secara paralel
          const [isAllowed, userRole] = await Promise.all([
            verifyWhitelist(email),
            fetchUserRole(userId)
          ]);

          if (mounted) {
            if (isAllowed) {
              setSession(currentSession);
              setUser(currentSession.user);
              setRole(userRole);
            } else {
              await supabase.auth.signOut();
            }
          }
        }
      } catch (error) {
        console.error("Auth Init Error:", error);
      } finally {
        // MAU ERROR ATAU TIDAK, LOADING HARUS MATI
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (currentSession?.user && mounted) {
        const isAllowed = await verifyWhitelist(currentSession.user.email);
        if (isAllowed) {
          const userRole = await fetchUserRole(currentSession.user.id);
          setSession(currentSession);
          setUser(currentSession.user);
          setRole(userRole);
        } else {
          await supabase.auth.signOut();
        }
      } else if (mounted) {
        setUser(null);
        setSession(null);
        setRole(null);
      }
      if (mounted) setLoading(false);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const isAllowed = await verifyWhitelist(cleanEmail);
      
      if (!isAllowed) return { error: "Email Anda tidak terdaftar." };

      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) return { error: 'Email atau password salah.' };
      
      return { error: null };
    } catch (e) {
      return { error: 'Terjadi kesalahan login.' };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const isAllowed = await verifyWhitelist(cleanEmail);
      if (!isAllowed) return { error: "Email belum terdaftar (Whitelist)." };
      
      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { full_name: fullName } }
      });
      
      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      return { error: "Terjadi kesalahan pendaftaran." };
    }
  };

  const signOut = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error('Logout gagal. Silakan coba lagi.');
    } else {
      setUser(null);
      setSession(null);
      setRole(null);
      toast.success('Logout berhasil.');
    }

    setLoading(false);
  };

  const resetPassword = async (email: string) => {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const isAllowed = await verifyWhitelist(cleanEmail);
      if (!isAllowed) return { error: "Email tidak terdaftar (Whitelist)." };

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      return { error: "Terjadi kesalahan saat mengirim email reset." };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      return { error: "Terjadi kesalahan saat memperbarui password." };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, session, role, isAdmin: role === 'admin', 
      loading, signIn, signUp, signOut, 
      resetPassword,
      updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
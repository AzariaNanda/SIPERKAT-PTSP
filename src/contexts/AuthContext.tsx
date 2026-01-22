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

  // Fungsi internal untuk mengambil role user dari Database via RPC
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
    // 1. Inisialisasi awal session saat aplikasi pertama kali dimuat
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const userRole = await fetchUserRole(session.user.id);
          setRole(userRole);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 2. Listener perubahan status autentikasi (Login, Logout, dsb)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (session?.user) {
          // Non-blocking fetch: Update role di background agar loading cepat selesai
          fetchUserRole(session.user.id).then(setRole);
        }
      } else if (event === 'SIGNED_OUT') {
        setRole(null);
      }

      // Pastikan loading dimatikan pada event krusial agar UI tidak freeze/hang
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || !session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // FUNGSI LOGIN
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ 
      email: email.toLowerCase().trim(), 
      password 
    });
    
    if (error) {
      const msg = error.message === 'Invalid login credentials' ? 'Email atau password salah' : error.message;
      return { error: msg };
    }
    return { error: null };
  };

  /**
   * FUNGSI SIGN UP (REVISI FINAL)
   * 1. Cek apakah email ada di Whitelist.
   * 2. Jika ada, lakukan pendaftaran di Supabase Auth.
   * 3. Jika sukses, update kolom 'is_registered' di whitelist menjadi TRUE.
   */
  const signUp = async (email: string, password: string, fullName: string): Promise<{ error: string | null }> => {
    try {
      const cleanEmail = email.toLowerCase().trim();

      // A. Cek Whitelist terlebih dahulu (Pintu Masuk Utama)
      const { data: isWhitelisted, error: checkError } = await supabase.rpc('check_whitelist_email', { 
        _email: cleanEmail 
      });

      if (checkError) {
        console.error("Whitelist check error:", checkError);
        return { error: "Gagal memverifikasi database pegawai." };
      }
      
      if (!isWhitelisted) {
        return { error: "Email Anda belum terdaftar dalam database pegawai. Hubungi Admin Utama untuk mendapatkan akses." };
      }

      // B. Proses Registrasi Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { 
          emailRedirectTo: `${window.location.origin}/`,
          data: { 
            full_name: fullName 
          } 
        }
      });

      if (signUpError) return { error: signUpError.message };

      // C. PERBAIKAN: Sinkronisasi Status Registrasi
      // Setelah user berhasil mendaftar di Auth, kita tandai di tabel whitelist bahwa email ini sudah "Aktif"
      if (authData.user) {
        const { error: updateError } = await supabase
          .from('pegawai_whitelist')
          .update({ is_registered: true })
          .eq('email', cleanEmail);
          
        if (updateError) console.error("Gagal sinkron status registrasi:", updateError);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || "Terjadi kesalahan sistem pendaftaran." };
    }
  };

  // FUNGSI LUPA PASSWORD
  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error ? error.message : null };
  };

  // FUNGSI GANTI PASSWORD BARU
  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error ? error.message : null };
  };

  // FUNGSI LOGOUT
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.log("Signout cleanup");
    }
    setUser(null);
    setSession(null);
    setRole(null);
    toast.success('LOGOUT BERHASIL');
  };

  const value = { 
    user, 
    session, 
    role, 
    isAdmin: role === 'admin', 
    loading, 
    signIn, 
    signUp, 
    signOut, 
    resetPassword, 
    updatePassword 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
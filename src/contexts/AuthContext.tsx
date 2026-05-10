import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AppRole = "admin" | "user" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole;
  isAdmin: boolean;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ALWAYS_ALLOWED_EMAILS = [
  "subbagumpeg.dpmptspbms@gmail.com",
  "dpmpptspkabbanyumas@gmail.com",
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string): Promise<AppRole> => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      if (error || !data) return "user";
      return (data.role as AppRole) || "user";
    } catch (err) {
      return "user";
    }
  };

  const verifyWhitelist = async (
    email: string | undefined,
  ): Promise<boolean | null> => {
    if (!email) return false;
    const cleanEmail = email.toLowerCase().trim();
    if (ALWAYS_ALLOWED_EMAILS.includes(cleanEmail)) return true;

    try {
      // Simple timeout wrapper
      let timeoutId: NodeJS.Timeout | null = null;
      
      const rpcPromise = supabase
        .rpc("check_whitelist_email", {
          _email: cleanEmail,
        });

      // Create timeout promise
      const timeoutPromise = new Promise<any>((resolve) => {
        timeoutId = setTimeout(() => {
          resolve(null); // Return null on timeout (treat as failed verification)
        }, 5000);
      });

      // Race them
      const result = await Promise.race([rpcPromise, timeoutPromise]);
      if (timeoutId) clearTimeout(timeoutId);

      if (result === null) return null; // Timeout occurred
      const { data, error } = result as any;
      if (error) return null;
      return data === true;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const safetyTimeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Auth loading timeout - forcing completion');
        setLoading(false);
      }
    }, 15000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      try {
        if (event === "PASSWORD_RECOVERY") {
          if (currentSession && mounted) {
            setSession(currentSession);
            setUser(currentSession.user);
          }
          return;
        }

        if (event === "SIGNED_OUT" || !currentSession?.user) {
          if (mounted) {
            setUser(null);
            setSession(null);
            setRole(null);
          }
          return;
        }

        if (mounted) {
          const isAllowed = await verifyWhitelist(currentSession.user.email);
          if (!mounted) return;

          if (isAllowed === true) {
            const userRole = await fetchUserRole(currentSession.user.id);
            if (mounted) {
              setSession(currentSession);
              setUser(currentSession.user);
              setRole(userRole);
            }
          } else if (isAllowed === false) {
            await supabase.auth.signOut();
          }
        }
      } catch (e) {
        if (e instanceof Error && e.name !== "AbortError") {
          console.error("onAuthStateChange error:", e);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(safetyTimeoutId);
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const isAllowed = await verifyWhitelist(cleanEmail);

      if (isAllowed === null)
        return { error: "Gagal memverifikasi akses. Periksa koneksi Anda." };
      if (isAllowed === false) return { error: "Email Anda tidak terdaftar." };

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) return { error: "Email atau password salah." };

      return { error: null };
    } catch (e) {
      return { error: "Terjadi kesalahan login." };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const isAllowed = await verifyWhitelist(cleanEmail);
      if (isAllowed === null)
        return { error: "Gagal memverifikasi akses. Periksa koneksi Anda." };
      if (isAllowed === false)
        return { error: "Email belum terdaftar (Whitelist)." };

      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { full_name: fullName } },
      });

      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      return { error: "Terjadi kesalahan pendaftaran." };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error("Logout gagal. Silakan coba lagi.");
    } else {
      toast.success("Logout berhasil.");
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const cleanEmail = email.toLowerCase().trim();
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
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return {
          error:
            "Auth session missing or expired. Please request a new reset link.",
        };
      }
      return { error: "Terjadi kesalahan saat memperbarui password." };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isAdmin: role === "admin",
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

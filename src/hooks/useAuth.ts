import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AppRole } from '@/types/siperkat';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch role from database - this is the source of truth
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      // Get role from database - only authorized users will have a role
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        // No role found - user is not authorized
        toast.error('Akses Ditolak. Anda tidak memiliki akses ke sistem ini.');
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setRole(null);
        return;
      }

      setRole(data.role as AppRole);
    } catch (error) {
      // Error fetching role - sign out for security
      toast.error('Gagal memverifikasi akses. Silakan coba lagi.');
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setRole(null);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      }
    });

    if (error) {
      toast.error('Gagal login: ' + error.message);
      setLoading(false);
    }
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

  const isAdmin = role === 'admin';

  return {
    user,
    session,
    role,
    isAdmin,
    loading,
    signInWithGoogle,
    signOut,
  };
};

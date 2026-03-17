import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', currentUser.id)
          .eq('role', 'admin')
          .maybeSingle();
        setIsAdmin(!!data);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', currentUser.id)
          .eq('role', 'admin')
          .maybeSingle()
          .then(({ data }) => {
            setIsAdmin(!!data);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: window.location.origin,
      },
    });
  };

  const signOut = async () => {
    return supabase.auth.signOut();
  };

  return { user, isAdmin, loading, signIn, signUp, signOut };
}

import { supabase } from '@/integrations/supabase/client';

export async function isAdminUser(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .limit(1);

  if (error) {
    throw error;
  }

  return (data?.length ?? 0) > 0;
}

export async function signOutCurrentSession() {
  await supabase.auth.signOut();
}

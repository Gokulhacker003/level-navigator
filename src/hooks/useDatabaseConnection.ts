import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type ConnectionState = 'checking' | 'connected' | 'disconnected';

export function useDatabaseConnection(pollIntervalMs = 20000) {
  const [status, setStatus] = useState<ConnectionState>('checking');
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  const checkConnection = useCallback(async () => {
    if (!mountedRef.current) return;
    setStatus(previous => (previous === 'connected' ? previous : 'checking'));

    try {
      // Use a lightweight HEAD query to verify connectivity and auth/session handling.
      const { error } = await supabase
        .from('rooms')
        .select('id', { head: true, count: 'exact' })
        .limit(1);

      if (!mountedRef.current) return;
      setStatus(error ? 'disconnected' : 'connected');
    } catch {
      if (!mountedRef.current) return;
      setStatus('disconnected');
    } finally {
      if (mountedRef.current) {
        setLastCheckedAt(new Date());
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void checkConnection();

    const timer = window.setInterval(() => {
      void checkConnection();
    }, pollIntervalMs);

    return () => {
      mountedRef.current = false;
      window.clearInterval(timer);
    };
  }, [checkConnection, pollIntervalMs]);

  return { status, lastCheckedAt, recheck: checkConnection };
}

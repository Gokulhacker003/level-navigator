import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type ConnectionState = 'checking' | 'connected' | 'disconnected';

export function useDatabaseConnection(pollIntervalMs = 20000) {
  const [status, setStatus] = useState<ConnectionState>('checking');
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const mountedRef = useRef(true);
  const schemaMissingRef = useRef(false);

  const checkConnection = useCallback(async () => {
    if (!mountedRef.current || schemaMissingRef.current) return;
    setStatus(previous => (previous === 'connected' ? previous : 'checking'));

    try {
      // Use a lightweight HEAD query to verify connectivity and auth/session handling.
      const { error } = await supabase
        .from('waypoints')
        .select('id', { head: true, count: 'exact' })
        .limit(1);

      if (!mountedRef.current) return;

      if (error) {
        // Supabase/PostgREST returns PGRST205 when a table is missing in schema cache.
        if (error.code === 'PGRST205') {
          schemaMissingRef.current = true;
        }
        setStatus('disconnected');
      } else {
        setStatus('connected');
      }
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
    schemaMissingRef.current = false;
    void checkConnection();

    const timer = window.setInterval(() => {
      if (schemaMissingRef.current) return;
      void checkConnection();
    }, pollIntervalMs);

    return () => {
      mountedRef.current = false;
      window.clearInterval(timer);
    };
  }, [checkConnection, pollIntervalMs]);

  return { status, lastCheckedAt, recheck: checkConnection };
}

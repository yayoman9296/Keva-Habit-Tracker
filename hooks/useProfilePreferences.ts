import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

type ShabbatModeListener = (enabled: boolean) => void;
const listeners = new Set<ShabbatModeListener>();

/** Notify all mounted preference hooks when Shabbat mode changes mid-session. */
export function notifyShabbatModeChanged(enabled: boolean): void {
  listeners.forEach((listener) => listener(enabled));
}

export function useProfilePreferences() {
  const [shabbatMode, setShabbatMode] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setShabbatMode(true);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('shabbat_mode')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      setShabbatMode(data?.shabbat_mode ?? true);
    } catch {
      setShabbatMode(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  useEffect(() => {
    const listener: ShabbatModeListener = (enabled) => {
      setShabbatMode(enabled);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return { shabbatMode, loading, refresh: fetchPreferences };
}

import { useCallback, useEffect, useMemo, useState } from 'react';

import { toLocalDateString } from '@/lib/dates';
import {
  computeHabitStats,
  computeHeatmap,
  computeOverallStats,
  type HabitStat,
  type HeatmapDay,
  type OverallStats,
} from '@/lib/stats';
import { isShabbosDate } from '@/lib/streaks';
import { supabase } from '@/lib/supabase';
import type { CheckinRow, HabitRow } from '@/lib/types';
import { useProfilePreferences } from '@/hooks/useProfilePreferences';

export function useStats() {
  const { shabbatMode } = useProfilePreferences();
  const isFrozenDay = shabbatMode ? isShabbosDate : undefined;
  const [habits, setHabits] = useState<HabitRow[]>([]);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const today = toLocalDateString();

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setHabits([]);
        setCheckins([]);
        return;
      }

      const [habitsResult, checkinsResult] = await Promise.all([
        supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true }),
        supabase.from('checkins').select('*').eq('user_id', user.id),
      ]);

      if (habitsResult.error) throw habitsResult.error;
      if (checkinsResult.error) throw checkinsResult.error;

      setHabits((habitsResult.data ?? []) as HabitRow[]);
      setCheckins((checkinsResult.data ?? []) as CheckinRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
      setHabits([]);
      setCheckins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const overall = useMemo<OverallStats>(
    () => computeOverallStats(habits, checkins, today, isFrozenDay),
    [habits, checkins, today, isFrozenDay],
  );

  const habitStats = useMemo<HabitStat[]>(
    () => computeHabitStats(habits, checkins, today, isFrozenDay),
    [habits, checkins, today, isFrozenDay],
  );

  const heatmap = useMemo<HeatmapDay[]>(
    () => computeHeatmap(checkins, 30),
    [checkins],
  );

  const maxHabitsPerDay = habits.length;

  return {
    overall,
    habitStats,
    heatmap,
    maxHabitsPerDay,
    loading,
    error,
    fetchStats,
    hasHabits: habits.length > 0,
  };
}
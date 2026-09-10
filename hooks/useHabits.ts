import { useCallback, useEffect, useMemo, useState } from 'react';

import { getLastNDays, toLocalDateString } from '@/lib/dates';
import { maxCurrentStreak, calculateStreaks, isShabbosDate } from '@/lib/streaks';
import { supabase } from '@/lib/supabase';
import type { CheckinRow, HabitRow, HabitWithStreaks, SuggestedHabit } from '@/lib/types';
import { useProfilePreferences } from '@/hooks/useProfilePreferences';

export function useHabits() {
  const [habits, setHabits] = useState<HabitWithStreaks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const today = toLocalDateString();

  // When Shabbat Mode is on, freeze streaks across the Shabbos window so a
  // forgotten Motzei-Shabbos check-in doesn't wipe the streak.
  const { shabbatMode } = useProfilePreferences();
  const isFrozenDay = shabbatMode ? isShabbosDate : undefined;

  const fetchHabits = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setHabits([]);
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

      const habitRows = (habitsResult.data ?? []) as HabitRow[];
      const checkinRows = (checkinsResult.data ?? []) as CheckinRow[];

      const checkinsByHabit = checkinRows.reduce<Record<string, string[]>>((acc, checkin) => {
        if (!acc[checkin.habit_id]) {
          acc[checkin.habit_id] = [];
        }
        acc[checkin.habit_id].push(checkin.checked_date);
        return acc;
      }, {});

      const enriched: HabitWithStreaks[] = habitRows.map((habit) => {
        const checkinDates = checkinsByHabit[habit.id] ?? [];
        const { current, best } = calculateStreaks(checkinDates, today, isFrozenDay);

        return {
          ...habit,
          checkinDates,
          currentStreak: current,
          bestStreak: best,
          completedToday: checkinDates.includes(today),
        };
      });

      setHabits(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load habits');
      setHabits([]);
    } finally {
      setLoading(false);
    }
  }, [today, isFrozenDay]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const heroStreak = useMemo(() => maxCurrentStreak(habits), [habits]);

  const weeklyCompletion = useMemo(() => {
    const last7 = getLastNDays(7);
    const allDates = new Set(habits.flatMap((habit) => habit.checkinDates));
    return last7.map((date) => allDates.has(date));
  }, [habits]);

  const weeklyLabels = useMemo(() => {
    const last7 = getLastNDays(7);
    return last7.map((date) => {
      const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      const [year, month, day] = date.split('-').map(Number);
      return labels[new Date(year, month - 1, day).getDay()];
    });
  }, []);

  const addHabit = useCallback(
    async (input: { name: string; is_private: boolean }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const { data, error: insertError } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          name: input.name.trim(),
          is_private: input.is_private,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const habit = data as HabitRow;
      const newHabit: HabitWithStreaks = {
        ...habit,
        checkinDates: [],
        currentStreak: 0,
        bestStreak: 0,
        completedToday: false,
      };

      setHabits((prev) => [...prev, newHabit]);
      return newHabit;
    },
    [],
  );

  const addSuggestedHabit = useCallback(
    async (suggested: SuggestedHabit) => {
      return addHabit({
        name: suggested.name,
        is_private: suggested.is_private,
      });
    },
    [addHabit],
  );

  const toggleCheckin = useCallback(
    async (habitId: string) => {
      const habit = habits.find((item) => item.id === habitId);
      if (!habit) return;

      const wasCompleted = habit.completedToday;
      const optimisticDates = wasCompleted
        ? habit.checkinDates.filter((date) => date !== today)
        : [...habit.checkinDates, today];
      const { current, best } = calculateStreaks(optimisticDates, today, isFrozenDay);

      setHabits((prev) =>
        prev.map((item) =>
          item.id === habitId
            ? {
                ...item,
                checkinDates: optimisticDates,
                completedToday: !wasCompleted,
                currentStreak: current,
                bestStreak: Math.max(item.bestStreak, best),
              }
            : item,
        ),
      );

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error('Not authenticated');

        if (wasCompleted) {
          const { error: deleteError } = await supabase
            .from('checkins')
            .delete()
            .eq('habit_id', habitId)
            .eq('checked_date', today);

          if (deleteError) throw deleteError;
        } else {
          const { error: insertError } = await supabase.from('checkins').insert({
            habit_id: habitId,
            user_id: user.id,
            checked_date: today,
          });

          if (insertError) throw insertError;
        }
      } catch {
        await fetchHabits();
      }
    },
    [habits, today, fetchHabits],
  );

  const checkInAll = useCallback(async () => {
    const unchecked = habits.filter((habit) => !habit.completedToday);
    if (unchecked.length === 0) return;

    setHabits((prev) =>
      prev.map((item) => {
        if (item.completedToday) return item;

        const optimisticDates = [...item.checkinDates, today];
        const { current, best } = calculateStreaks(optimisticDates, today, isFrozenDay);

        return {
          ...item,
          checkinDates: optimisticDates,
          completedToday: true,
          currentStreak: current,
          bestStreak: Math.max(item.bestStreak, best),
        };
      }),
    );

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const { error: insertError } = await supabase.from('checkins').insert(
        unchecked.map((habit) => ({
          habit_id: habit.id,
          user_id: user.id,
          checked_date: today,
        })),
      );

      if (insertError) throw insertError;
    } catch {
      await fetchHabits();
    }
  }, [habits, today, fetchHabits, isFrozenDay]);

  const swapHabit = useCallback(
    async (habitId: string, input: { name: string; is_private: boolean }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const { error: deleteCheckinsError } = await supabase
        .from('checkins')
        .delete()
        .eq('habit_id', habitId)
        .eq('user_id', user.id);

      if (deleteCheckinsError) throw deleteCheckinsError;

      const { data, error: updateError } = await supabase
        .from('habits')
        .update({
          name: input.name.trim(),
          is_private: input.is_private,
          created_at: new Date().toISOString(),
        })
        .eq('id', habitId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      const swapped = data as HabitRow;
      const swappedHabit: HabitWithStreaks = {
        ...swapped,
        checkinDates: [],
        currentStreak: 0,
        bestStreak: 0,
        completedToday: false,
      };

      setHabits((prev) =>
        prev.map((item) => (item.id === habitId ? swappedHabit : item)),
      );

      return swappedHabit;
    },
    [],
  );

  const allCheckedToday = habits.length > 0 && habits.every((habit) => habit.completedToday);

  return {
    habits,
    loading,
    error,
    heroStreak,
    weeklyCompletion,
    weeklyLabels,
    fetchHabits,
    addHabit,
    addSuggestedHabit,
    swapHabit,
    toggleCheckin,
    checkInAll,
    allCheckedToday,
  };
}
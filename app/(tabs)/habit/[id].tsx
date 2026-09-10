import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SwapHabitModal from '@/components/SwapHabitModal';
import WeekGrid from '@/components/WeekGrid';
import { useHabits } from '@/hooks/useHabits';
import { useSubscription } from '@/hooks/useSubscription';
import { getLastNDays, toLocalDateString } from '@/lib/dates';
import { canSwapHabit } from '@/lib/habits';
import { HapticNotify, hapticNotify } from '@/lib/haptics';
import { calculateStreaks, isShabbosDate } from '@/lib/streaks';
import { useProfilePreferences } from '@/hooks/useProfilePreferences';
import { supabase } from '@/lib/supabase';
import type { CheckinRow, HabitRow, SuggestedHabit } from '@/lib/types';
import { colors, fonts } from '@/theme';

export default function HabitDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const habitId = Array.isArray(id) ? id[0] : id;

  const [habit, setHabit] = useState<HabitRow | null>(null);
  const [otherHabitNames, setOtherHabitNames] = useState<string[]>([]);
  const [checkinDates, setCheckinDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [swapModalVisible, setSwapModalVisible] = useState(false);

  const { swapHabit } = useHabits();
  const { isPremium } = useSubscription();
  const today = toLocalDateString();

  const fetchHabit = useCallback(async () => {
    if (!habitId) {
      setError('Habit not found');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const [habitResult, checkinsResult, allHabitsResult] = await Promise.all([
        supabase
          .from('habits')
          .select('*')
          .eq('id', habitId)
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('checkins')
          .select('*')
          .eq('habit_id', habitId)
          .eq('user_id', user.id),
        supabase.from('habits').select('id, name').eq('user_id', user.id),
      ]);

      if (habitResult.error) throw habitResult.error;
      if (checkinsResult.error) throw checkinsResult.error;
      if (allHabitsResult.error) throw allHabitsResult.error;

      const loadedHabit = habitResult.data as HabitRow;
      setHabit(loadedHabit);
      setOtherHabitNames(
        ((allHabitsResult.data ?? []) as Pick<HabitRow, 'id' | 'name'>[])
          .filter((item) => item.id !== habitId)
          .map((item) => item.name),
      );
      setCheckinDates(
        ((checkinsResult.data ?? []) as CheckinRow[]).map((c) => c.checked_date),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load habit');
      setHabit(null);
      setCheckinDates([]);
    } finally {
      setLoading(false);
    }
  }, [habitId]);

  useEffect(() => {
    fetchHabit();
  }, [fetchHabit]);

  const { shabbatMode } = useProfilePreferences();
  const isFrozenDay = shabbatMode ? isShabbosDate : undefined;

  const { current, best } = useMemo(
    () => calculateStreaks(checkinDates, today, isFrozenDay),
    [checkinDates, today, isFrozenDay],
  );

  const weeklyCompletion = useMemo(() => {
    const last7 = getLastNDays(7);
    const dateSet = new Set(checkinDates);
    return last7.map((date) => dateSet.has(date));
  }, [checkinDates]);

  const weeklyLabels = useMemo(() => {
    const last7 = getLastNDays(7);
    return last7.map((date) => {
      const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      const [year, month, day] = date.split('-').map(Number);
      return labels[new Date(year, month - 1, day).getDay()];
    });
  }, []);

  const showSwapOption = !isPremium && habit ? canSwapHabit(habit.created_at, today) : false;

  function handleSwapPress() {
    setSwapModalVisible(true);
  }

  async function performSwap(newHabit: SuggestedHabit) {
    if (!habitId) return;

    try {
      const swapped = await swapHabit(habitId, {
        name: newHabit.name,
        is_private: newHabit.is_private,
      });
      setHabit(swapped);
      setCheckinDates([]);
      hapticNotify(HapticNotify.Success);
    } catch (err) {
      hapticNotify(HapticNotify.Error);
      throw err;
    }
  }

  function handleSwap(newHabit: SuggestedHabit) {
    return new Promise<void>((resolve, reject) => {
      Alert.alert(
        'Swap habit?',
        `Replace "${habit?.name}" with "${newHabit.name}"? Your streak history will be deleted and the new habit starts at day 0.`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => reject(new Error('Cancelled')) },
          {
            text: 'Swap',
            style: 'destructive',
            onPress: () => {
              performSwap(newHabit).then(resolve).catch(reject);
            },
          },
        ],
      );
    });
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backArrow}>{'\u2190'}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : error || !habit ? (
        <View style={styles.centered}>
          <Text style={styles.error}>{error ?? 'Habit not found'}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{habit.name}</Text>
          {habit.is_private ? <Text style={styles.privateLabel}>Private</Text> : null}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{current}</Text>
              <Text style={styles.statLabel}>Current streak</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{best}</Text>
              <Text style={styles.statLabel}>Best streak</Text>
            </View>
          </View>

          <View style={styles.weekSection}>
            <Text style={styles.sectionLabel}>LAST 7 DAYS</Text>
            <WeekGrid completedDays={weeklyCompletion} dayLabels={weeklyLabels} />
          </View>

          {showSwapOption ? (
            <View style={styles.settingsSection}>
              <Text style={styles.sectionLabel}>SETTINGS</Text>
              <View style={styles.settingsCard}>
                <Pressable style={styles.swapRow} onPress={handleSwapPress}>
                  <View>
                    <Text style={styles.swapLabel}>Swap habit</Text>
                    <Text style={styles.swapHint}>
                      Replace this habit and start fresh at day 0
                    </Text>
                  </View>
                  <Text style={styles.swapChevron}>{'\u203A'}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}

      <SwapHabitModal
        visible={swapModalVisible}
        existingHabitNames={otherHabitNames}
        onClose={() => setSwapModalVisible(false)}
        onSwap={handleSwap}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  header: {
    backgroundColor: colors.bg,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  backButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  backArrow: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 28,
    lineHeight: 32,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  scroll: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 32,
    fontWeight: '700',
  },
  privateLabel: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: 1.5,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  stat: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    padding: 16,
  },
  statValue: {
    color: colors.accent,
    fontFamily: fonts.heading,
    fontSize: 36,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 12,
    marginTop: 4,
  },
  weekSection: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionLabel: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  settingsSection: {
    marginTop: 24,
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  swapRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  swapLabel: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: '600',
  },
  swapHint: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 12,
    marginTop: 4,
  },
  swapChevron: {
    color: colors.muted,
    fontFamily: fonts.heading,
    fontSize: 24,
    marginLeft: 12,
  },
  error: {
    color: colors.accent2,
    fontFamily: fonts.label,
    fontSize: 14,
    textAlign: 'center',
  },
});
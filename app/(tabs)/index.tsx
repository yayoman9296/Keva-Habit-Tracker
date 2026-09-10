import { SymbolView } from 'expo-symbols';
import { type Href, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AddHabitModal from '@/components/AddHabitModal';
import GetStarted from '@/components/GetStarted';
import HabitItem from '@/components/HabitItem';
import ShabbatBadge from '@/components/ShabbatBadge';
import StreakHero from '@/components/StreakHero';
import WeekGrid from '@/components/WeekGrid';
import { useHabits } from '@/hooks/useHabits';
import { useProfilePreferences } from '@/hooks/useProfilePreferences';
import { useSubscription } from '@/hooks/useSubscription';
import {
  HapticImpact,
  HapticNotify,
  hapticImpact,
  hapticNotify,
} from '@/lib/haptics';
import { FREE_HABIT_LIMIT } from '@/lib/revenuecat';
import { useShabbat } from '@/lib/shabbat';
import { colors, fonts } from '@/theme';

export default function TodayScreen() {
  const router = useRouter();
  const {
    habits,
    loading,
    error,
    heroStreak,
    weeklyCompletion,
    weeklyLabels,
    fetchHabits,
    addHabit,
    addSuggestedHabit,
    toggleCheckin,
    checkInAll,
    allCheckedToday,
  } = useHabits();

  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { shabbatMode } = useProfilePreferences();
  const { isShabbat } = useShabbat();
  const { isPremium } = useSubscription();
  const shabbatActive = shabbatMode && isShabbat;
  const atHabitLimit = !isPremium && habits.length >= FREE_HABIT_LIMIT;
  const showHabitPicker = isPremium
    ? habits.length === 0
    : habits.length < FREE_HABIT_LIMIT;
  const checkInScale = useRef(new Animated.Value(1)).current;
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      hapticNotify(HapticNotify.Error);
    }
    lastErrorRef.current = error;
  }, [error]);

  function handleCheckInAll() {
    hapticImpact(HapticImpact.Heavy);
    Animated.sequence([
      Animated.timing(checkInScale, {
        toValue: 0.96,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(checkInScale, {
        toValue: 1.04,
        friction: 4,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.spring(checkInScale, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();
    checkInAll();
  }

  function openAddHabit() {
    if (atHabitLimit) {
      router.push('/paywall' as Href);
      return;
    }
    setModalVisible(true);
  }

  async function handleAddHabit(input: { name: string; is_private: boolean }) {
    if (!isPremium && habits.length >= FREE_HABIT_LIMIT) {
      router.push('/paywall' as Href);
      return;
    }
    await addHabit(input);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHabits();
    setRefreshing(false);
  }, [fetchHabits]);

  if (loading && habits.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (showHabitPicker) {
    return (
      <View style={styles.container}>
        <GetStarted
          existingHabitNames={habits.map((habit) => habit.name)}
          onAddSuggested={async (habit) => {
            if (!isPremium && habits.length >= FREE_HABIT_LIMIT) {
              router.push('/paywall' as Href);
              return;
            }
            await addSuggestedHabit(habit);
          }}
          onAddCustom={openAddHabit}
        />
        <AddHabitModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSave={handleAddHabit}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {shabbatActive ? (
          <View style={styles.shabbatBadge}>
            <ShabbatBadge />
          </View>
        ) : null}

        <StreakHero streak={heroStreak} />

        <Animated.View style={{ transform: [{ scale: checkInScale }] }}>
          <Pressable
            style={[
              styles.checkInButton,
              shabbatActive && styles.checkInButtonShabbat,
              !shabbatActive && allCheckedToday && styles.checkInButtonDisabled,
            ]}
            onPress={handleCheckInAll}
            disabled={shabbatActive || allCheckedToday}
          >
            <Text
              style={[
                styles.checkInText,
                shabbatActive && styles.checkInTextDisabled,
              ]}
            >
              {shabbatActive
                ? 'Check-ins paused'
                : allCheckedToday
                  ? 'All checked in'
                  : 'Check in for today'}
            </Text>
          </Pressable>
        </Animated.View>

        <View style={styles.weekSection}>
          <WeekGrid completedDays={weeklyCompletion} dayLabels={weeklyLabels} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.habitList}>
          {habits.map((habit) => (
            <HabitItem
              key={habit.id}
              name={habit.name}
              streak={habit.currentStreak}
              completed={habit.completedToday}
              disabled={shabbatActive}
              onPress={() =>
                router.push(`/(tabs)/habit/${habit.id}` as Href)
              }
              onToggle={() => toggleCheckin(habit.id)}
            />
          ))}
        </View>

        <Pressable style={styles.addButton} onPress={openAddHabit}>
          {atHabitLimit ? (
            <SymbolView
              name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
              tintColor={colors.accent}
              size={16}
              style={styles.lockIcon}
            />
          ) : null}
          <Text style={styles.addButtonText}>Add habit</Text>
        </Pressable>
      </ScrollView>

      <AddHabitModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAddHabit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  centered: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    flex: 1,
    justifyContent: 'center',
  },
  scroll: {
    paddingBottom: 40,
  },
  shabbatBadge: {
    marginBottom: 16,
  },
  checkInButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    marginTop: 24,
    paddingVertical: 16,
  },
  checkInButtonDisabled: {
    opacity: 0.5,
  },
  checkInButtonShabbat: {
    backgroundColor: colors.surface2,
    opacity: 1,
  },
  checkInText: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: '600',
  },
  checkInTextDisabled: {
    color: colors.muted,
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
  error: {
    color: colors.accent2,
    fontFamily: fonts.label,
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
  },
  habitList: {
    gap: 12,
    marginTop: 24,
  },
  addButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 16,
  },
  lockIcon: {
    marginTop: 1,
  },
  addButtonText: {
    color: colors.accent,
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: '600',
  },
});
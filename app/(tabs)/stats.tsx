import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import CalendarHeatmap from '@/components/CalendarHeatmap';
import HabitStatCard from '@/components/HabitStatCard';
import OverallStatsCard from '@/components/OverallStatsCard';
import PremiumOverlay from '@/components/PremiumOverlay';
import { useStats } from '@/hooks/useStats';
import { useSubscription } from '@/hooks/useSubscription';
import { colors, fonts } from '@/theme';

export default function StatsScreen() {
  const {
    overall,
    habitStats,
    heatmap,
    maxHabitsPerDay,
    loading,
    error,
    fetchStats,
    hasHabits,
  } = useStats();

  const { isPremium } = useSubscription();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, [fetchStats]);

  return (
      <View style={styles.container}>
        <Text style={styles.title}>Stats</Text>

        {loading && !hasHabits ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : !hasHabits ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Add habits on the Today screen to see your stats here.
            </Text>
          </View>
        ) : (
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
            <OverallStatsCard stats={overall} />

            <View style={styles.section}>
              <PremiumOverlay locked={!isPremium}>
                <CalendarHeatmap days={heatmap} maxCount={maxHabitsPerDay} />
              </PremiumOverlay>
            </View>

            <Text style={styles.sectionTitle}>BY HABIT</Text>
            <PremiumOverlay locked={!isPremium}>
              <View style={styles.habitList}>
                {habitStats.map((stat) => (
                  <HabitStatCard key={stat.id} stat={stat} />
                ))}
              </View>
            </PremiumOverlay>

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>
        )}
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
  title: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 24,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyText: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  scroll: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 24,
  },
  habitList: {
    gap: 12,
  },
  error: {
    color: colors.accent2,
    fontFamily: fonts.label,
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
  },
});
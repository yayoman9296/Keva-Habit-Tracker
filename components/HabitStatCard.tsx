import { StyleSheet, Text, View } from 'react-native';

import WeekGrid from '@/components/WeekGrid';
import type { HabitStat } from '@/lib/stats';
import { colors, fonts } from '@/theme';

type HabitStatCardProps = {
  stat: HabitStat;
};

export default function HabitStatCard({ stat }: HabitStatCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{stat.name}</Text>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{stat.currentStreak}</Text>
          <Text style={styles.metricLabel}>Current</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{stat.bestStreak}</Text>
          <Text style={styles.metricLabel}>Best</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{stat.completionRate30d}%</Text>
          <Text style={styles.metricLabel}>30 days</Text>
        </View>
      </View>

      <View style={styles.weekSection}>
        <WeekGrid
          completedDays={stat.weekCompletion}
          dayLabels={stat.weekLabels}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  name: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  metric: {
    flex: 1,
  },
  metricValue: {
    color: colors.accent,
    fontFamily: fonts.heading,
    fontSize: 20,
    fontWeight: '700',
  },
  metricLabel: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 11,
    marginTop: 2,
  },
  weekSection: {
    marginTop: 16,
  },
});
import { StyleSheet, Text, View } from 'react-native';

import type { OverallStats } from '@/lib/stats';
import { colors, fonts } from '@/theme';

type OverallStatsCardProps = {
  stats: OverallStats;
};

const METRICS = [
  { key: 'longestStreakEver', label: 'Longest streak' },
  { key: 'totalCheckins', label: 'Total check-ins' },
  { key: 'activeHabitsCount', label: 'Active habits' },
  { key: 'bestCompletionWeek', label: 'Best week' },
] as const;

export default function OverallStatsCard({ stats }: OverallStatsCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>OVERALL</Text>
      <View style={styles.grid}>
        {METRICS.map((metric) => (
          <View key={metric.key} style={styles.cell}>
            <Text style={styles.value}>{stats[metric.key]}</Text>
            <Text style={styles.label}>{metric.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  sectionLabel: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cell: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: '46%',
    padding: 16,
  },
  value: {
    color: colors.accent,
    fontFamily: fonts.heading,
    fontSize: 28,
    fontWeight: '700',
  },
  label: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 12,
    marginTop: 4,
  },
});
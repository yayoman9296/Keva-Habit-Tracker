import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import type { HeatmapDay } from '@/lib/stats';
import { colors, fonts } from '@/theme';

type CalendarHeatmapProps = {
  days: HeatmapDay[];
  maxCount: number;
};

const COLUMNS = 6;
const GAP = 6;
const HORIZONTAL_PADDING = 40;

function cellColor(count: number, maxCount: number): string {
  if (count === 0 || maxCount === 0) return colors.surface2;

  const ratio = count / maxCount;
  if (ratio >= 1) return colors.accent;

  const r1 = 0x16;
  const g1 = 0x16;
  const b1 = 0x2a;
  const r2 = 0x7c;
  const g2 = 0x6a;
  const b2 = 0xf7;

  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);

  return `rgb(${r}, ${g}, ${b})`;
}

export default function CalendarHeatmap({ days, maxCount }: CalendarHeatmapProps) {
  const { width: screenWidth } = useWindowDimensions();
  const availableWidth = screenWidth - 48 - HORIZONTAL_PADDING;
  const cellSize = (availableWidth - GAP * (COLUMNS - 1)) / COLUMNS;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>LAST 30 DAYS</Text>
      <View style={styles.grid}>
        {days.map((day) => {
          const isBright = day.completedCount > 0 && day.completedCount >= maxCount * 0.5;

          return (
            <View
              key={day.date}
              style={[
                styles.cell,
                {
                  backgroundColor: cellColor(day.completedCount, maxCount),
                  height: cellSize,
                  width: cellSize,
                },
              ]}
            >
              <Text style={[styles.dayNumber, isBright && styles.dayNumberLight]}>
                {day.dayOfMonth}
              </Text>
            </View>
          );
        })}
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
    gap: GAP,
  },
  cell: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
  },
  dayNumber: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 11,
  },
  dayNumberLight: {
    color: colors.text,
  },
});
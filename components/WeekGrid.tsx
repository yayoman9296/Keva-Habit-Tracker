import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

type WeekGridProps = {
  completedDays?: boolean[];
  dayLabels?: string[];
};

export default function WeekGrid({
  completedDays = Array(7).fill(false),
  dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
}: WeekGridProps) {
  return (
    <View style={styles.container}>
      {dayLabels.map((day, index) => (
        <View key={`${day}-${index}`} style={styles.dayColumn}>
          <View
            style={[
              styles.dot,
              completedDays[index] ? styles.dotDone : styles.dotEmpty,
            ]}
          />
          <Text style={styles.label}>{day}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  dotEmpty: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderWidth: 1,
  },
  dotDone: {
    backgroundColor: colors.accent,
  },
  label: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 11,
  },
});
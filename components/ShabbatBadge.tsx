import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

export default function ShabbatBadge() {
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>{'\u05E9\u05D1\u05EA \u05E9\u05DC\u05D5\u05DD \u2721'}</Text>
      <Text style={styles.subtext}>Check-ins are paused for Shabbat</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderColor: colors.accent2,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    color: colors.accent2,
    fontFamily: fonts.heading,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtext: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 12,
    marginTop: 6,
  },
});
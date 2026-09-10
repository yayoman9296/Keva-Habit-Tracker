import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

type StreakHeroProps = {
  streak: number;
};

export default function StreakHero({ streak }: StreakHeroProps) {
  const label = streak === 1 ? '1 day streak' : `${streak} day streak`;
  const scale = useRef(new Animated.Value(1)).current;
  const prevStreak = useRef(streak);

  useEffect(() => {
    if (streak > prevStreak.current) {
      scale.setValue(0.7);
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 140,
        useNativeDriver: true,
      }).start();
    }
    prevStreak.current = streak;
  }, [streak, scale]);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.count, { transform: [{ scale }] }]}>
        {streak}
      </Animated.Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  count: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 72,
    fontWeight: '700',
    lineHeight: 80,
  },
  label: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 14,
    marginTop: 4,
  },
});

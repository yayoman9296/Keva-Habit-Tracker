import { type Href, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { colors, fonts } from '@/theme';

export default function OnboardingOneScreen() {
  const router = useRouter();
  const [streak, setStreak] = useState(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setStreak((prev) => (prev >= 30 ? 1 : prev + 1));
      scale.value = withSequence(
        withTiming(1.08, { duration: 120 }),
        withTiming(1, { duration: 180 }),
      );
    }, 100);

    return () => clearInterval(interval);
  }, [scale]);

  const animatedNumberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <OnboardingShell
      headline="Build what lasts."
      subtext="Track your habits. Grow your streak. Become who you want to be."
      buttonLabel="Next"
      onContinue={() => router.push('/(onboarding)/two' as Href)}
    >
      <View style={styles.counterWrap}>
        <Animated.Text style={[styles.counter, animatedNumberStyle]}>{streak}</Animated.Text>
        <Text style={styles.counterLabel}>day streak</Text>
        <View style={styles.dotsRow}>
          {Array.from({ length: 7 }).map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index < streak % 7 && styles.dotActive]}
            />
          ))}
        </View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  counterWrap: {
    alignItems: 'center',
  },
  counter: {
    color: colors.accent,
    fontFamily: fonts.heading,
    fontSize: 96,
    fontWeight: '700',
    lineHeight: 104,
  },
  counterLabel: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 14,
    letterSpacing: 1,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 28,
  },
  dot: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: 4,
    borderWidth: 1,
    height: 8,
    width: 8,
  },
  dotActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
});
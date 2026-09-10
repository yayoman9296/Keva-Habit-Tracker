import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { setOnboardingSeen } from '@/lib/onboarding';
import { colors, fonts } from '@/theme';

export default function OnboardingThreeScreen() {
  const router = useRouter();
  const glow = useSharedValue(0.4);

  useEffect(() => {
    glow.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [glow]);

  const badgeGlowStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.25 + glow.value * 0.55,
    borderColor: `rgba(247, 162, 106, ${0.45 + glow.value * 0.55})`,
    transform: [{ scale: 0.98 + glow.value * 0.04 }],
  }));

  async function handleGetStarted() {
    await setOnboardingSeen();
    router.replace('/(auth)/signup');
  }

  return (
    <OnboardingShell
      headline="Shabbat-aware."
      subtext="Keva knows when Shabbat starts. Check-ins pause automatically. Your streak is safe."
      buttonLabel="Get Started"
      onContinue={handleGetStarted}
    >
      <Animated.View style={[styles.badge, badgeGlowStyle]}>
        <Text style={styles.badgeIcon}>{'\u2721'}</Text>
        <Text style={styles.badgeTitle}>Shabbat Mode</Text>
        <Text style={styles.badgeSubtext}>Check-ins paused</Text>
        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>Streak protected</Text>
        </View>
      </Animated.View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.accent2,
    borderRadius: 20,
    borderWidth: 2,
    paddingHorizontal: 32,
    paddingVertical: 28,
    shadowColor: colors.accent2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 24,
  },
  badgeIcon: {
    color: colors.accent2,
    fontSize: 32,
  },
  badgeTitle: {
    color: colors.accent2,
    fontFamily: fonts.heading,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  badgeSubtext: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 13,
    marginTop: 6,
  },
  badgePill: {
    backgroundColor: colors.surface2,
    borderColor: colors.accent2,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  badgePillText: {
    color: colors.accent2,
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
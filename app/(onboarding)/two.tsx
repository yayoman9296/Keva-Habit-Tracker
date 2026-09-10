import { type Href, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import OnboardingShell from '@/components/onboarding/OnboardingShell';
import { colors, fonts } from '@/theme';

const PRIVATE_HABITS = ['Tehillim', 'Learning', 'No phone'];

function PhoneMockup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.phone}>
      <View style={styles.notch} />
      <Text style={styles.phoneTitle}>{title}</Text>
      <View style={styles.phoneBody}>{children}</View>
    </View>
  );
}

export default function OnboardingTwoScreen() {
  const router = useRouter();

  return (
    <OnboardingShell
      headline="Your habits. Your privacy."
      subtext="Friends see your streak. Never your habits. What you track stays yours."
      buttonLabel="Next"
      onContinue={() => router.push('/(onboarding)/three' as Href)}
    >
      <View style={styles.phonesRow}>
        <PhoneMockup title="You">
          {PRIVATE_HABITS.map((habit) => (
            <View key={habit} style={styles.habitRow}>
              <Text style={styles.habitName}>{habit}</Text>
              <View style={styles.habitCheck} />
            </View>
          ))}
          <Text style={styles.privateTag}>Private</Text>
        </PhoneMockup>

        <PhoneMockup title="Friends">
          <Text style={styles.publicStreak}>12</Text>
          <Text style={styles.publicLabel}>day streak</Text>
          <Text style={styles.publicHint}>Habit names hidden</Text>
        </PhoneMockup>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  phonesRow: {
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'center',
  },
  phone: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    maxWidth: 150,
    overflow: 'hidden',
    paddingBottom: 16,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  notch: {
    alignSelf: 'center',
    backgroundColor: colors.surface2,
    borderRadius: 6,
    height: 5,
    marginBottom: 12,
    width: 36,
  },
  phoneTitle: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  phoneBody: {
    gap: 8,
  },
  habitRow: {
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  habitName: {
    color: colors.text,
    flex: 1,
    fontFamily: fonts.label,
    fontSize: 10,
  },
  habitCheck: {
    backgroundColor: colors.accent3,
    borderRadius: 3,
    height: 10,
    width: 10,
  },
  privateTag: {
    color: colors.accent,
    fontFamily: fonts.label,
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  publicStreak: {
    color: colors.accent,
    fontFamily: fonts.heading,
    fontSize: 44,
    fontWeight: '700',
    textAlign: 'center',
  },
  publicLabel: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 10,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  publicHint: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 9,
    marginTop: 12,
    textAlign: 'center',
  },
});
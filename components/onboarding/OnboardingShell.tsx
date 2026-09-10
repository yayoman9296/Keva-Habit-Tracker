import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/theme';

type OnboardingShellProps = {
  headline: string;
  subtext: string;
  buttonLabel: string;
  onContinue: () => void;
  children: React.ReactNode;
};

export default function OnboardingShell({
  headline,
  subtext,
  buttonLabel,
  onContinue,
  children,
}: OnboardingShellProps) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Animated.View style={styles.content}>
        <Text style={styles.headline}>{headline}</Text>
        <Text style={styles.subtext}>{subtext}</Text>
        <Animated.View style={styles.visual}>{children}</Animated.View>
      </Animated.View>

      <Pressable style={styles.button} onPress={onContinue}>
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    flex: 1,
    paddingHorizontal: 28,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  headline: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  subtext: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 14,
    maxWidth: 320,
  },
  visual: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
    minHeight: 220,
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
  },
  buttonText: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: '700',
  },
});

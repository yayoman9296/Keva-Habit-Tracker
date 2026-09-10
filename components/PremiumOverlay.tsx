import { BlurView } from 'expo-blur';
import { type Href, useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

type PremiumOverlayProps = {
  children: React.ReactNode;
  locked: boolean;
};

export default function PremiumOverlay({ children, locked }: PremiumOverlayProps) {
  const router = useRouter();

  if (!locked) {
    return <>{children}</>;
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.content} pointerEvents="none">
        {children}
      </View>
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={24} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidBlur]} />
        )}
        <View style={styles.overlayContent}>
          <Text style={styles.title}>Premium feature</Text>
          <Text style={styles.subtitle}>
            Upgrade to unlock full stats history and insights.
          </Text>
          <Pressable
            style={styles.upgradeButton}
            onPress={() => router.push('/paywall' as Href)}
          >
            <Text style={styles.upgradeText}>Upgrade</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  content: {
    opacity: 0.35,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  androidBlur: {
    backgroundColor: 'rgba(8, 8, 16, 0.82)',
  },
  overlayContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 1,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  upgradeButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  upgradeText: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: '600',
  },
});
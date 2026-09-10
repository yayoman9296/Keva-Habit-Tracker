import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';

import { useSubscription } from '@/hooks/useSubscription';
import { colors, fonts } from '@/theme';

type PlanId = 'monthly' | 'yearly';

const BENEFITS = [
  'Unlimited habits',
  'Full stats history',
  'Friend challenges',
  'Priority support',
];

export default function PaywallScreen() {
  const router = useRouter();
  const {
    purchase,
    restore,
    isLoading,
    monthlyPackage,
    yearlyPackage,
    error,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<PlanId>('yearly');
  const [purchasing, setPurchasing] = useState(false);

  const selectedPackage: PurchasesPackage | null =
    selectedPlan === 'yearly' ? yearlyPackage : monthlyPackage;

  async function handleContinue() {
    if (!selectedPackage) {
      Alert.alert(
        'Unavailable',
        'Subscription packages are not available right now. Try again later.',
      );
      return;
    }

    setPurchasing(true);
    try {
      await purchase(selectedPackage);
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Purchase failed';
      if (!message.toLowerCase().includes('cancel')) {
        Alert.alert('Purchase failed', message);
      }
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    setPurchasing(true);
    try {
      await restore();
      Alert.alert('Restored', 'Your purchases have been restored.');
      router.back();
    } catch (err) {
      Alert.alert(
        'Restore failed',
        err instanceof Error ? err.message : 'Could not restore purchases',
      );
    } finally {
      setPurchasing(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Go Premium</Text>
      <Text style={styles.subtitle}>Unlimited habits. Unlimited potential.</Text>

      <View style={styles.plans}>
        <Pressable
          style={[styles.planCard, selectedPlan === 'monthly' && styles.planSelected]}
          onPress={() => setSelectedPlan('monthly')}
        >
          <Text style={styles.planLabel}>Monthly</Text>
          <Text style={styles.planPrice}>$4.99/month</Text>
        </Pressable>

        <Pressable
          style={[styles.planCard, selectedPlan === 'yearly' && styles.planSelected]}
          onPress={() => setSelectedPlan('yearly')}
        >
          <View style={styles.planHeader}>
            <Text style={styles.planLabel}>Yearly</Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>SAVE 50%</Text>
            </View>
          </View>
          <Text style={styles.planPrice}>$29.99/year</Text>
        </Pressable>
      </View>

      <View style={styles.benefits}>
        {BENEFITS.map((benefit) => (
          <View key={benefit} style={styles.benefitRow}>
            <Text style={styles.benefitCheck}>✓</Text>
            <Text style={styles.benefitText}>{benefit}</Text>
          </View>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.continueButton, purchasing && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={purchasing || isLoading}
      >
        {purchasing || isLoading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.continueText}>Continue</Text>
        )}
      </Pressable>

      <Pressable onPress={handleRestore} disabled={purchasing} style={styles.restoreButton}>
        <Text style={styles.restoreText}>Restore purchases</Text>
      </Pressable>

      <Pressable onPress={() => router.back()} style={styles.dismissButton}>
        <Text style={styles.dismissText}>Maybe later</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  scroll: {
    paddingBottom: 48,
    paddingHorizontal: 24,
    paddingTop: 72,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  plans: {
    gap: 12,
    marginTop: 32,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
  },
  planSelected: {
    borderColor: colors.accent,
  },
  planHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  planLabel: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: '600',
  },
  planPrice: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 14,
    marginTop: 6,
  },
  saveBadge: {
    backgroundColor: colors.accent2,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  saveBadgeText: {
    color: colors.bg,
    fontFamily: fonts.label,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  benefits: {
    gap: 12,
    marginTop: 28,
  },
  benefitRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  benefitCheck: {
    color: colors.accent3,
    fontFamily: fonts.label,
    fontSize: 16,
    fontWeight: '700',
  },
  benefitText: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 15,
  },
  error: {
    color: colors.accent2,
    fontFamily: fonts.label,
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
  },
  continueButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    marginTop: 32,
    paddingVertical: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  continueText: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: '600',
  },
  restoreButton: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  restoreText: {
    color: colors.accent,
    fontFamily: fonts.label,
    fontSize: 14,
  },
  dismissButton: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
  },
  dismissText: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 14,
  },
});
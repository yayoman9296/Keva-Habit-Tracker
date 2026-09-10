import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';

import { checkPremiumStatus, initRevenueCat, isRevenueCatEnabled } from '@/lib/revenuecat';

export function useSubscription() {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [yearlyPackage, setYearlyPackage] = useState<PurchasesPackage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyCustomerInfo = useCallback((info: CustomerInfo) => {
    setIsPremium(checkPremiumStatus(info));
  }, []);

  const loadSubscription = useCallback(async () => {
    if (Platform.OS === 'web' || !isRevenueCatEnabled()) {
      setIsPremium(false);
      setMonthlyPackage(null);
      setYearlyPackage(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await initRevenueCat();

      const [customerInfo, offerings] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getOfferings(),
      ]);

      applyCustomerInfo(customerInfo);

      const current = offerings.current;
      if (current) {
        setMonthlyPackage(
          current.monthly ??
            current.availablePackages.find((pkg) => pkg.packageType === 'MONTHLY') ??
            current.availablePackages[0] ??
            null,
        );
        setYearlyPackage(
          current.annual ??
            current.availablePackages.find((pkg) => pkg.packageType === 'ANNUAL') ??
            current.availablePackages[1] ??
            null,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
    } finally {
      setIsLoading(false);
    }
  }, [applyCustomerInfo]);

  useEffect(() => {
    loadSubscription();

    if (Platform.OS === 'web' || !isRevenueCatEnabled()) return;

    const listener = (info: CustomerInfo) => {
      applyCustomerInfo(info);
    };

    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [loadSubscription, applyCustomerInfo]);

  const purchase = useCallback(
    async (pkg: PurchasesPackage) => {
      if (Platform.OS === 'web' || !isRevenueCatEnabled()) {
        throw new Error('Purchases are not available');
      }

      setError(null);
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      applyCustomerInfo(customerInfo);
    },
    [applyCustomerInfo],
  );

  const restore = useCallback(async () => {
    if (Platform.OS === 'web' || !isRevenueCatEnabled()) {
      throw new Error('Purchases are not available');
    }

    setError(null);
    const customerInfo = await Purchases.restorePurchases();
    applyCustomerInfo(customerInfo);
    return customerInfo;
  }, [applyCustomerInfo]);

  return {
    isPremium,
    purchase,
    restore,
    isLoading,
    monthlyPackage,
    yearlyPackage,
    error,
    refresh: loadSubscription,
  };
}
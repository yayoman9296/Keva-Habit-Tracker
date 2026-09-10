import Constants from 'expo-constants';
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, type CustomerInfo } from 'react-native-purchases';

const REVENUECAT_TEST_API_KEY = 'test_aMzEbfaqtCziazSDOjxPbGyJSMs';

export const PREMIUM_ENTITLEMENT = 'premium';
export const FREE_HABIT_LIMIT = 2;

let initialized = false;
let disabled = false;

function isDevOrPreviewBuild(): boolean {
  if (__DEV__) return true;

  if (Constants.appOwnership === 'expo') return true;

  const buildProfile = Constants.expoConfig?.extra?.eas?.buildProfile as string | undefined;
  return buildProfile === 'development' || buildProfile === 'preview';
}

function getReleaseApiKey(): string {
  const platformKey =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

  return (platformKey ?? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '').trim();
}

function isValidReleaseKey(apiKey: string): boolean {
  return apiKey.length > 0 && !apiKey.startsWith('test_');
}

export function getRevenueCatApiKey(): string | null {
  if (Platform.OS === 'web') return null;

  if (isDevOrPreviewBuild()) {
    return REVENUECAT_TEST_API_KEY;
  }

  const releaseKey = getReleaseApiKey();
  return isValidReleaseKey(releaseKey) ? releaseKey : null;
}

export function isRevenueCatEnabled(): boolean {
  if (Platform.OS === 'web') return false;
  if (disabled) return false;
  return getRevenueCatApiKey() !== null;
}

export function checkPremiumStatus(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;
}

export async function initRevenueCat(appUserId?: string): Promise<void> {
  if (Platform.OS === 'web') return;
  if (initialized || disabled) return;

  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    disabled = true;
    return;
  }

  try {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
    await Purchases.configure({
      apiKey,
      appUserID: appUserId,
    });
    initialized = true;
  } catch {
    disabled = true;
  }
}

export async function loginRevenueCat(appUserId: string): Promise<void> {
  if (Platform.OS === 'web' || !isRevenueCatEnabled()) return;

  await initRevenueCat();
  if (!initialized) return;

  try {
    await Purchases.logIn(appUserId);
  } catch {
    // Stay on free plan if login fails.
  }
}

export async function logoutRevenueCat(): Promise<void> {
  if (Platform.OS === 'web' || !initialized) return;

  try {
    await Purchases.logOut();
  } catch {
    // Non-fatal on sign-out.
  }
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ONBOARDING_SEEN_KEY = 'onboarding_seen';

type OnboardingSeenListener = (seen: boolean) => void;
const listeners = new Set<OnboardingSeenListener>();

function canUseStorage(): boolean {
  if (Platform.OS === 'web' && typeof window === 'undefined') {
    return false;
  }
  return true;
}

export async function getOnboardingSeen(): Promise<boolean> {
  if (!canUseStorage()) return false;

  try {
    if (Platform.OS === 'web') {
      return window.localStorage.getItem(ONBOARDING_SEEN_KEY) === 'true';
    }

    const value = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setOnboardingSeen(): Promise<void> {
  if (!canUseStorage()) return;

  try {
    if (Platform.OS === 'web') {
      window.localStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
    } else {
      await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, 'true');
    }
  } catch {
    // Non-fatal — user can still sign up.
  }

  // Notify in-memory subscribers (e.g. the root navigator's routing guard)
  // so they see the flag immediately instead of waiting for a relaunch.
  listeners.forEach((listener) => listener(true));
}

/**
 * Subscribe to onboarding-seen changes made during this session.
 * Returns an unsubscribe function.
 */
export function subscribeOnboardingSeen(listener: OnboardingSeenListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
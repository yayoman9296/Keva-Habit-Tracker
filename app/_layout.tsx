import {
  Syne_400Regular,
  Syne_500Medium,
  Syne_600SemiBold,
  Syne_700Bold,
  Syne_800ExtraBold,
} from '@expo-google-fonts/syne';
import {
  DMMono_400Regular,
  DMMono_500Medium,
} from '@expo-google-fonts/dm-mono';
import { Session } from '@supabase/supabase-js';
import { useFonts } from 'expo-font';
import { type Href, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { getOnboardingSeen, subscribeOnboardingSeen } from '@/lib/onboarding';
import { initRevenueCat, loginRevenueCat, logoutRevenueCat } from '@/lib/revenuecat';
import { supabase } from '@/lib/supabase';
import { colors } from '@/theme';

export {
  ErrorBoundary,
} from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Syne: Syne_700Bold,
    'Syne-Regular': Syne_400Regular,
    'Syne-Medium': Syne_500Medium,
    'Syne-SemiBold': Syne_600SemiBold,
    'Syne-ExtraBold': Syne_800ExtraBold,
    DMMono: DMMono_400Regular,
    'DMMono-Medium': DMMono_500Medium,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <RootLayoutNav />
      </View>
    </SafeAreaProvider>
  );
}

function RootLayoutNav() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initRevenueCat().catch(() => {
      // RevenueCat may be unavailable in Expo Go / web — app still runs.
    });
  }, []);

  useEffect(() => {
    getOnboardingSeen().then(setOnboardingSeen);
    // Keep the flag in sync when it's set mid-session (finishing onboarding),
    // otherwise the routing guard below bounces the user back to onboarding.
    const unsubscribe = subscribeOnboardingSeen(setOnboardingSeen);
    return unsubscribe;
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setInitialized(true);
      if (currentSession?.user?.id) {
        loginRevenueCat(currentSession.user.id).catch(() => {});
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user?.id) {
        loginRevenueCat(currentSession.user.id).catch(() => {});
      } else {
        logoutRevenueCat().catch(() => {});
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized || onboardingSeen === null) return;

    const rootSegment = segments[0] as string;
    const inAuthGroup = rootSegment === '(auth)';
    const inOnboardingGroup = rootSegment === '(onboarding)';
    const isPublicRoute = rootSegment === 'paywall' || rootSegment === 'modal';

    if (session) {
      if (inAuthGroup || inOnboardingGroup) {
        router.replace('/(tabs)');
      }
      return;
    }

    if (!onboardingSeen && !inOnboardingGroup) {
      router.replace('/(onboarding)/one' as Href);
      return;
    }

    if (onboardingSeen && !inAuthGroup && !inOnboardingGroup && !isPublicRoute) {
      router.replace('/(auth)/login');
    }
  }, [session, initialized, onboardingSeen, segments, router]);

  if (!initialized || onboardingSeen === null) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
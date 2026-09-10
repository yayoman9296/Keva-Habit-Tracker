import { useRouter, usePathname, useSegments } from 'expo-router';
import { useCallback, useMemo } from 'react';

function isMainTab(segments: string[]): boolean {
  if (segments[0] !== '(tabs)') return false;

  const tab = segments[1];
  return !tab || tab === 'index' || tab === 'stats' || tab === 'profile';
}

export function useBackNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();

  const isMainTabScreen = useMemo(() => isMainTab(segments), [segments]);

  const canGoBack = router.canGoBack();

  const shouldShowBack = !isMainTabScreen && canGoBack;

  const goBack = useCallback(() => {
    if (canGoBack) {
      router.back();
    }
  }, [router, canGoBack]);

  return {
    shouldShowBack,
    goBack,
    isMainTabScreen,
  };
}
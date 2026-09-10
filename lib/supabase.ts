import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

if (Platform.OS !== 'web') {
  require('react-native-url-polyfill/auto');
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Keva] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Auth and data will fail until .env is configured.',
  );
}

function canUseStorage(): boolean {
  // Expo static web rendering runs in Node.js where window is undefined.
  if (Platform.OS === 'web' && typeof window === 'undefined') {
    return false;
  }
  return true;
}

const AuthStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (!canUseStorage()) return null;

    if (Platform.OS === 'web') {
      return window.localStorage.getItem(key);
    }

    const secure = await SecureStore.getItemAsync(key);
    if (secure !== null) return secure;
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (!canUseStorage()) return;

    if (Platform.OS === 'web') {
      window.localStorage.setItem(key, value);
      return;
    }

    await AsyncStorage.setItem(key, value);
    if (value.length <= 2048) {
      await SecureStore.setItemAsync(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (!canUseStorage()) return;

    if (Platform.OS === 'web') {
      window.localStorage.removeItem(key);
      return;
    }

    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  },
};

/** Node/SSR (Expo static web export) lacks native WebSocket on Node < 22. */
function getRealtimeOptions(): { transport?: typeof WebSocket } {
  if (typeof WebSocket !== 'undefined') {
    return {};
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ws = require('ws') as typeof WebSocket;
  return { transport: ws };
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AuthStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: getRealtimeOptions(),
});
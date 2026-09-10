import { useCallback, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { getUserCoords, isShabbatAt, useShabbat } from './shabbat';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const REMINDER_MESSAGES = [
  "Your streak is waiting. Don't break the chain. 🔥",
  'Small steps, big results. Check in now.',
  'One more day. Keep going.',
  'Your future self will thank you.',
  "Consistency is the key. You've got this.",
] as const;

const SCHEDULE_HORIZON_DAYS = 30;
const NOTIFICATION_TITLE = 'Keva';

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function cancelAll(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

function parseTimeOfDay(time: string): { hour: number; minute: number } | null {
  const [hourStr, minuteStr] = time.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

function pickMessage(fireDate: Date): string {
  // Deterministic by calendar day so the same day always shows the same message.
  const epochDay = Math.floor(fireDate.getTime() / 86_400_000);
  return REMINDER_MESSAGES[((epochDay % REMINDER_MESSAGES.length) + REMINDER_MESSAGES.length) % REMINDER_MESSAGES.length];
}

export async function scheduleNotification(time: string): Promise<void> {
  if (Platform.OS === 'web') return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  await cancelAll();

  const parsed = parseTimeOfDay(time);
  if (!parsed) return;

  // If location permission is denied, coords is null — schedule every day without Shabbat filtering.
  const coords = await getUserCoords();
  const now = new Date();

  for (let i = 0; i < SCHEDULE_HORIZON_DAYS; i++) {
    const fire = new Date(now);
    fire.setDate(now.getDate() + i);
    fire.setHours(parsed.hour, parsed.minute, 0, 0);

    if (fire <= now) continue;
    if (coords && isShabbatAt(coords, fire)) continue;

    await Notifications.scheduleNotificationAsync({
      content: { title: NOTIFICATION_TITLE, body: pickMessage(fire) },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fire,
      },
    });
  }
}

export type UseNotificationsResult = {
  permissionGranted: boolean;
  scheduleNotification: (time: string) => Promise<void>;
  cancelAll: () => Promise<void>;
};

export function useNotifications(): UseNotificationsResult {
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Primes the location cache and permission so scheduleNotification() can
  // filter Shabbat windows without prompting mid-schedule.
  useShabbat();

  useEffect(() => {
    let cancelled = false;
    requestNotificationPermission().then((granted) => {
      if (!cancelled) setPermissionGranted(granted);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const schedule = useCallback(async (time: string) => {
    await scheduleNotification(time);
  }, []);

  const cancel = useCallback(async () => {
    await cancelAll();
  }, []);

  return {
    permissionGranted,
    scheduleNotification: schedule,
    cancelAll: cancel,
  };
}

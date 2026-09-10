import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export function hapticImpact(
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium,
) {
  if (!isNative) return;
  Haptics.impactAsync(style).catch(() => {});
}

export function hapticNotify(
  type: Haptics.NotificationFeedbackType,
) {
  if (!isNative) return;
  Haptics.notificationAsync(type).catch(() => {});
}

export const HapticImpact = Haptics.ImpactFeedbackStyle;
export const HapticNotify = Haptics.NotificationFeedbackType;

import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { HapticImpact, hapticImpact } from '@/lib/haptics';
import { colors, fonts } from '@/theme';

type HabitItemProps = {
  name: string;
  streak: number;
  completed: boolean;
  disabled?: boolean;
  onPress?: () => void;
  onToggle?: () => void;
};

export default function HabitItem({
  name,
  streak,
  completed,
  disabled = false,
  onPress,
  onToggle,
}: HabitItemProps) {
  const streakLabel = streak === 1 ? '1 day' : `${streak} days`;
  const scale = useRef(new Animated.Value(1)).current;

  function handleToggle() {
    hapticImpact(HapticImpact.Medium);
    if (!completed) {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          tension: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
    onToggle?.();
  }

  return (
    <View
      style={[styles.container, completed && styles.completed, disabled && styles.disabled]}
    >
      <Pressable style={styles.content} onPress={onPress}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.streak}>{streakLabel}</Text>
      </Pressable>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          style={[styles.checkbox, completed && styles.checkboxDone]}
          onPress={handleToggle}
          disabled={disabled}
          hitSlop={8}
        >
          {completed ? <Text style={styles.checkmark}>✓</Text> : null}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 16,
  },
  completed: {
    borderColor: colors.accent3,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: '600',
  },
  streak: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 12,
    marginTop: 4,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: colors.muted,
    borderRadius: 6,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkboxDone: {
    backgroundColor: colors.accent3,
    borderColor: colors.accent3,
  },
  checkmark: {
    color: colors.bg,
    fontFamily: fonts.label,
    fontSize: 14,
    fontWeight: '700',
  },
});

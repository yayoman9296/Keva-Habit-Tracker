import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SUGGESTED_HABITS } from '@/lib/suggestedHabits';
import type { SuggestedHabit } from '@/lib/types';
import { colors, fonts } from '@/theme';

type GetStartedProps = {
  existingHabitNames: string[];
  onAddSuggested: (habit: SuggestedHabit) => Promise<void>;
  onAddCustom: () => void;
};

export default function GetStarted({
  existingHabitNames,
  onAddSuggested,
  onAddCustom,
}: GetStartedProps) {
  const [addingId, setAddingId] = useState<string | null>(null);
  const [pendingNames, setPendingNames] = useState<string[]>([]);

  const availableHabits = useMemo(
    () =>
      SUGGESTED_HABITS.filter(
        (habit) =>
          !existingHabitNames.includes(habit.name) && !pendingNames.includes(habit.name),
      ),
    [existingHabitNames, pendingNames],
  );

  async function handleAdd(habit: SuggestedHabit) {
    setPendingNames((prev) => [...prev, habit.name]);
    setAddingId(habit.name);
    try {
      await onAddSuggested(habit);
    } catch {
      setPendingNames((prev) => prev.filter((name) => name !== habit.name));
    } finally {
      setAddingId(null);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Get started</Text>
      <Text style={styles.subtitle}>
        {existingHabitNames.length === 0
          ? 'Pick a habit to begin, or add your own.'
          : 'Pick another habit, or add your own.'}
      </Text>

      <View style={styles.grid}>
        {availableHabits.map((habit) => {
          const isAdding = addingId === habit.name;

          return (
            <Pressable
              key={habit.name}
              style={styles.card}
              onPress={() => handleAdd(habit)}
              disabled={addingId !== null}
            >
              {isAdding ? (
                <ActivityIndicator color={colors.accent} size="small" />
              ) : (
                <>
                  <Text style={styles.cardName}>{habit.name}</Text>
                  {habit.is_private ? (
                    <Text style={styles.cardPrivate}>Private</Text>
                  ) : null}
                </>
              )}
            </Pressable>
          );
        })}
      </View>

      <Pressable style={styles.skipButton} onPress={onAddCustom}>
        <Text style={styles.skipText}>Add your own habit</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 40,
    paddingTop: 8,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 14,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 32,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 100,
    padding: 16,
    width: '47%',
  },
  cardName: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardPrivate: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  skipButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 32,
    paddingVertical: 16,
  },
  skipText: {
    color: colors.accent,
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: '600',
  },
});
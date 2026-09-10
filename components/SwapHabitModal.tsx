import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AddHabitModal from '@/components/AddHabitModal';
import { SUGGESTED_HABITS } from '@/lib/suggestedHabits';
import type { SuggestedHabit } from '@/lib/types';
import { colors, fonts } from '@/theme';

type SwapHabitModalProps = {
  visible: boolean;
  existingHabitNames: string[];
  onClose: () => void;
  onSwap: (habit: SuggestedHabit) => Promise<void>;
};

export default function SwapHabitModal({
  visible,
  existingHabitNames,
  onClose,
  onSwap,
}: SwapHabitModalProps) {
  const [swappingName, setSwappingName] = useState<string | null>(null);
  const [pendingNames, setPendingNames] = useState<string[]>([]);
  const [customModalVisible, setCustomModalVisible] = useState(false);

  const availableHabits = useMemo(
    () =>
      SUGGESTED_HABITS.filter(
        (habit) =>
          !existingHabitNames.includes(habit.name) && !pendingNames.includes(habit.name),
      ),
    [existingHabitNames, pendingNames],
  );

  async function handleSwap(habit: SuggestedHabit) {
    setPendingNames((prev) => [...prev, habit.name]);
    setSwappingName(habit.name);
    try {
      await onSwap(habit);
      onClose();
    } catch {
      setPendingNames((prev) => prev.filter((name) => name !== habit.name));
    } finally {
      setSwappingName(null);
    }
  }

  async function handleCustomSwap(input: { name: string; is_private: boolean }) {
    await onSwap({ name: input.name, is_private: input.is_private });
    setCustomModalVisible(false);
    onClose();
  }

  function handleClose() {
    if (swappingName !== null) return;
    setCustomModalVisible(false);
    onClose();
  }

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboard}
        >
          <Pressable style={styles.overlay} onPress={handleClose}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scroll}
              bounces={false}
            >
              <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
                <View style={styles.handle} />
                <Text style={styles.title}>Swap habit</Text>
                <Text style={styles.subtitle}>
                  Choose a new habit. Your current streak history will be deleted.
                </Text>

                <View style={styles.grid}>
                  {availableHabits.map((habit) => {
                    const isSwapping = swappingName === habit.name;

                    return (
                      <Pressable
                        key={habit.name}
                        style={styles.card}
                        onPress={() => handleSwap(habit)}
                        disabled={swappingName !== null}
                      >
                        {isSwapping ? (
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

                <Pressable
                  style={styles.customButton}
                  onPress={() => setCustomModalVisible(true)}
                  disabled={swappingName !== null}
                >
                  <Text style={styles.customButtonText}>Choose your own</Text>
                </Pressable>
              </Pressable>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <AddHabitModal
        visible={customModalVisible}
        onClose={() => setCustomModalVisible(false)}
        onSave={handleCustomSwap}
      />
    </>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: 2,
    height: 4,
    marginBottom: 20,
    width: 40,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 13,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 24,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 88,
    padding: 14,
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
  customButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 24,
    paddingVertical: 16,
  },
  customButtonText: {
    color: colors.accent,
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: '600',
  },
});
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { toLocalDateString } from '@/lib/dates';
import { HapticNotify, hapticNotify } from '@/lib/haptics';
import type { FriendSummary } from '@/lib/types';
import { colors, fonts } from '@/theme';

type CreateChallengeModalProps = {
  visible: boolean;
  friends: FriendSummary[];
  loading: boolean;
  onCreate: (input: {
    challengedId: string;
    habitName: string;
    startDate: string;
    endDate?: string;
  }) => Promise<void>;
  onClose: () => void;
};

const DURATION_OPTIONS = [7, 14, 30] as const;

export default function CreateChallengeModal({
  visible,
  friends,
  loading,
  onCreate,
  onClose,
}: CreateChallengeModalProps) {
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [habitName, setHabitName] = useState('');
  const [durationDays, setDurationDays] = useState<number>(7);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setSelectedFriendId(null);
      setHabitName('');
      setDurationDays(7);
      setError(null);
    }
  }, [visible]);

  async function handleCreate() {
    if (!selectedFriendId) {
      setError('Choose a friend');
      hapticNotify(HapticNotify.Error);
      return;
    }

    if (!habitName.trim()) {
      setError('Enter a challenge name');
      hapticNotify(HapticNotify.Error);
      return;
    }

    const startDate = toLocalDateString();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays - 1);

    setError(null);
    try {
      await onCreate({
        challengedId: selectedFriendId,
        habitName: habitName.trim(),
        startDate,
        endDate: toLocalDateString(endDate),
      });
      hapticNotify(HapticNotify.Success);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create challenge');
      hapticNotify(HapticNotify.Error);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}
            bounces={false}
          >
            <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.header}>
                <Text style={styles.title}>New challenge</Text>
                <Pressable onPress={onClose} hitSlop={8}>
                  <Text style={styles.close}>Close</Text>
                </Pressable>
              </View>

              <Text style={styles.hint}>
                Pick a shared goal label. Your actual habit names stay private.
              </Text>

              <Text style={styles.label}>Friend</Text>
              <ScrollView style={styles.friendList} nestedScrollEnabled>
                {friends.map((friend) => (
                  <Pressable
                    key={friend.user_id}
                    style={[
                      styles.friendOption,
                      selectedFriendId === friend.user_id && styles.friendOptionSelected,
                    ]}
                    onPress={() => setSelectedFriendId(friend.user_id)}
                  >
                    <Text style={styles.friendName}>{friend.username}</Text>
                  </Pressable>
                ))}
                {friends.length === 0 ? (
                  <Text style={styles.emptyFriends}>Add a friend first</Text>
                ) : null}
              </ScrollView>

              <Text style={styles.label}>Challenge name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Tehillim, Learning, Exercise"
                placeholderTextColor={colors.muted}
                value={habitName}
                onChangeText={setHabitName}
              />

              <Text style={styles.label}>Duration</Text>
              <View style={styles.durationRow}>
                {DURATION_OPTIONS.map((days) => (
                  <Pressable
                    key={days}
                    style={[
                      styles.durationOption,
                      durationDays === days && styles.durationOptionSelected,
                    ]}
                    onPress={() => setDurationDays(days)}
                  >
                    <Text
                      style={[
                        styles.durationText,
                        durationDays === days && styles.durationTextSelected,
                      ]}
                    >
                      {days}d
                    </Text>
                  </Pressable>
                ))}
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                style={[styles.createButton, loading && styles.createButtonDisabled]}
                onPress={handleCreate}
                disabled={loading || friends.length === 0}
              >
                <Text style={styles.createButtonText}>
                  {loading ? 'Creating…' : 'Start challenge'}
                </Text>
              </Pressable>
            </Pressable>
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.6)',
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
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 22,
    fontWeight: '700',
  },
  close: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 14,
  },
  hint: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 12,
    marginBottom: 16,
  },
  label: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  friendList: {
    maxHeight: 140,
  },
  friendOption: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  friendOptionSelected: {
    borderColor: colors.accent,
  },
  friendName: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyFriends: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 13,
    paddingVertical: 8,
  },
  input: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fonts.label,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationOption: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 10,
  },
  durationOptionSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  durationText: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 14,
    textAlign: 'center',
  },
  durationTextSelected: {
    color: colors.text,
    fontWeight: '600',
  },
  error: {
    color: colors.accent2,
    fontFamily: fonts.label,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    marginTop: 20,
    paddingVertical: 14,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
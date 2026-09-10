import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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

import { HapticNotify, hapticNotify } from '@/lib/haptics';
import type { UserSearchResult } from '@/lib/types';
import { colors, fonts } from '@/theme';

type AddFriendModalProps = {
  visible: boolean;
  loading: boolean;
  onSearch: (query: string) => Promise<UserSearchResult[]>;
  onSendRequest: (userId: string) => Promise<void>;
  onClose: () => void;
  existingFriendIds: Set<string>;
};

export default function AddFriendModal({
  visible,
  loading,
  onSearch,
  onSendRequest,
  onClose,
  existingFriendIds,
}: AddFriendModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
      setSentIds(new Set());
      setError(null);
    }
  }, [visible]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      setError(null);
      try {
        const users = await onSearch(query);
        setResults(users);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  async function handleSend(userId: string) {
    setError(null);
    try {
      await onSendRequest(userId);
      setSentIds((prev) => new Set(prev).add(userId));
      hapticNotify(HapticNotify.Success);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send request');
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
                <Text style={styles.title}>Add friend</Text>
                <Pressable onPress={onClose} hitSlop={8}>
                  <Text style={styles.close}>Close</Text>
                </Pressable>
              </View>

              <Text style={styles.hint}>Search by username. Habit names stay private.</Text>

              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor={colors.muted}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />

              {searching ? (
                <ActivityIndicator color={colors.accent} style={styles.loader} />
              ) : null}

              {results.map((user) => {
                const alreadyFriend = existingFriendIds.has(user.id);
                const alreadySent = sentIds.has(user.id);

                return (
                  <View key={user.id} style={styles.resultRow}>
                    <Text style={styles.resultName}>{user.username}</Text>
                    {alreadyFriend ? (
                      <Text style={styles.resultMeta}>Friends</Text>
                    ) : alreadySent ? (
                      <Text style={styles.resultMeta}>Sent</Text>
                    ) : (
                      <Pressable
                        onPress={() => handleSend(user.id)}
                        disabled={loading}
                        style={styles.addButton}
                      >
                        <Text style={styles.addButtonText}>Add</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}

              {error ? <Text style={styles.error}>{error}</Text> : null}
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
    maxHeight: '80%',
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
  input: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fonts.label,
    fontSize: 15,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  loader: {
    marginVertical: 12,
  },
  resultRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  resultName: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: '600',
  },
  resultMeta: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 12,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  addButtonText: {
    color: colors.text,
    fontFamily: fonts.label,
    fontSize: 12,
    fontWeight: '600',
  },
  error: {
    color: colors.accent2,
    fontFamily: fonts.label,
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
});
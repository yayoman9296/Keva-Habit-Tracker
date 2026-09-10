import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FriendSummary } from '@/lib/types';
import { colors, fonts } from '@/theme';

type FriendCardProps = {
  friend: FriendSummary;
  onRemove?: () => void;
};

export default function FriendCard({ friend, onRemove }: FriendCardProps) {
  const streakLabel =
    friend.current_streak === 1 ? '1 day streak' : `${friend.current_streak} day streak`;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.username}>{friend.username}</Text>
          {friend.completed_today ? (
            <View style={styles.doneBadge}>
              <Text style={styles.doneBadgeText}>Done today</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.streak}>{streakLabel}</Text>
        <Text style={styles.meta}>
          {friend.active_habits_count}{' '}
          {friend.active_habits_count === 1 ? 'habit' : 'habits'} tracked
        </Text>
      </View>
      {onRemove ? (
        <Pressable onPress={onRemove} hitSlop={8}>
          <Text style={styles.remove}>Remove</Text>
        </Pressable>
      ) : null}
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
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  username: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: '600',
  },
  doneBadge: {
    backgroundColor: colors.surface2,
    borderColor: colors.accent3,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  doneBadgeText: {
    color: colors.accent3,
    fontFamily: fonts.label,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  streak: {
    color: colors.accent,
    fontFamily: fonts.label,
    fontSize: 13,
    marginTop: 4,
  },
  meta: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 12,
    marginTop: 2,
  },
  remove: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 12,
  },
});
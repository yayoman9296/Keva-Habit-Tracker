import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  formatChallengeDateRange,
  getChallengeDurationDays,
  getChallengeLeader,
} from '@/lib/social';
import type { ChallengeWithProgress } from '@/lib/types';
import { colors, fonts } from '@/theme';

type ChallengeCardProps = {
  challenge: ChallengeWithProgress;
  currentUserId: string;
  onCancel?: () => void;
  onComplete?: () => void;
};

export default function ChallengeCard({
  challenge,
  currentUserId,
  onCancel,
  onComplete,
}: ChallengeCardProps) {
  const isChallenger = challenge.challenger_id === currentUserId;
  const opponentName = isChallenger
    ? challenge.challenged_username
    : challenge.challenger_username;
  const myProgress = challenge.progress.find((p) => p.user_id === currentUserId);
  const opponentProgress = challenge.progress.find((p) => p.user_id !== currentUserId);
  const leader = getChallengeLeader(challenge, currentUserId);
  const totalDays = getChallengeDurationDays(challenge);
  const isActive = challenge.status === 'active';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.habitName}>{challenge.habit_name}</Text>
        <View
          style={[
            styles.statusBadge,
            challenge.status === 'active' && styles.statusActive,
            challenge.status === 'completed' && styles.statusCompleted,
            challenge.status === 'cancelled' && styles.statusCancelled,
          ]}
        >
          <Text style={styles.statusText}>{challenge.status}</Text>
        </View>
      </View>

      <Text style={styles.opponent}>vs {opponentName}</Text>
      <Text style={styles.dates}>{formatChallengeDateRange(challenge)}</Text>

      <View style={styles.scoreRow}>
        <View style={styles.scoreBlock}>
          <Text style={styles.scoreValue}>{myProgress?.days_completed ?? 0}</Text>
          <Text style={styles.scoreLabel}>You</Text>
        </View>
        <Text style={styles.scoreDivider}>/</Text>
        <View style={styles.scoreBlock}>
          <Text style={styles.scoreValue}>{opponentProgress?.days_completed ?? 0}</Text>
          <Text style={styles.scoreLabel}>{opponentName}</Text>
        </View>
        <Text style={styles.totalDays}>of {totalDays} days</Text>
      </View>

      {isActive && leader ? (
        <Text style={styles.leaderText}>
          {leader === 'tie'
            ? 'Tied so far'
            : leader === 'me'
              ? "You're ahead"
              : `${opponentName} is ahead`}
        </Text>
      ) : null}

      {isActive && (onCancel || onComplete) ? (
        <View style={styles.actions}>
          {onComplete ? (
            <Pressable style={styles.actionButton} onPress={onComplete}>
              <Text style={styles.completeText}>Mark complete</Text>
            </Pressable>
          ) : null}
          {onCancel ? (
            <Pressable style={styles.actionButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  habitName: {
    color: colors.text,
    flex: 1,
    fontFamily: fonts.heading,
    fontSize: 17,
    fontWeight: '700',
    marginRight: 12,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusActive: {
    backgroundColor: colors.surface2,
    borderColor: colors.accent,
    borderWidth: 1,
  },
  statusCompleted: {
    backgroundColor: colors.surface2,
    borderColor: colors.accent3,
    borderWidth: 1,
  },
  statusCancelled: {
    backgroundColor: colors.surface2,
    borderColor: colors.muted,
    borderWidth: 1,
  },
  statusText: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  opponent: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 13,
    marginTop: 6,
  },
  dates: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 12,
    marginTop: 2,
  },
  scoreRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 16,
  },
  scoreBlock: {
    alignItems: 'center',
  },
  scoreValue: {
    color: colors.accent,
    fontFamily: fonts.heading,
    fontSize: 28,
    fontWeight: '700',
  },
  scoreLabel: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 11,
    marginTop: 2,
  },
  scoreDivider: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 20,
    marginHorizontal: 16,
  },
  totalDays: {
    color: colors.muted,
    flex: 1,
    fontFamily: fonts.label,
    fontSize: 12,
    marginLeft: 12,
    textAlign: 'right',
  },
  leaderText: {
    color: colors.accent2,
    fontFamily: fonts.label,
    fontSize: 12,
    marginTop: 12,
  },
  actions: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'flex-end',
    marginTop: 16,
    paddingTop: 12,
  },
  actionButton: {
    paddingVertical: 4,
  },
  completeText: {
    color: colors.accent3,
    fontFamily: fonts.label,
    fontSize: 13,
  },
  cancelText: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 13,
  },
});
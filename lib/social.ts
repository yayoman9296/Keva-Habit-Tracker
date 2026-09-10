import { daysBetween, toLocalDateString } from '@/lib/dates';
import type { ChallengeRow, ChallengeWithProgress, FriendshipRow } from '@/lib/types';

export function getFriendUserId(
  friendship: FriendshipRow,
  currentUserId: string,
): string {
  return friendship.requester_id === currentUserId
    ? friendship.addressee_id
    : friendship.requester_id;
}

export function isIncomingRequest(
  friendship: FriendshipRow,
  currentUserId: string,
): boolean {
  return friendship.addressee_id === currentUserId && friendship.status === 'pending';
}

export function isOutgoingRequest(
  friendship: FriendshipRow,
  currentUserId: string,
): boolean {
  return friendship.requester_id === currentUserId && friendship.status === 'pending';
}

export function getChallengeDurationDays(challenge: ChallengeRow): number {
  const end = challenge.end_date ?? toLocalDateString();
  return daysBetween(challenge.start_date, end) + 1;
}

export function getChallengeLeader(
  challenge: ChallengeWithProgress,
  currentUserId: string,
): 'me' | 'opponent' | 'tie' | null {
  if (challenge.progress.length < 2) return null;

  const myProgress = challenge.progress.find((p) => p.user_id === currentUserId);
  const opponentProgress = challenge.progress.find((p) => p.user_id !== currentUserId);

  if (!myProgress || !opponentProgress) return null;
  if (myProgress.days_completed > opponentProgress.days_completed) return 'me';
  if (myProgress.days_completed < opponentProgress.days_completed) return 'opponent';
  return 'tie';
}

export function formatChallengeDateRange(challenge: ChallengeRow): string {
  const start = new Date(challenge.start_date + 'T12:00:00');
  const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (!challenge.end_date) {
    return `${startLabel} → ongoing`;
  }

  const end = new Date(challenge.end_date + 'T12:00:00');
  const endLabel = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startLabel} → ${endLabel}`;
}
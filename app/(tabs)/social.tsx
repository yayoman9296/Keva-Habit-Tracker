import { type Href, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import AddFriendModal from '@/components/AddFriendModal';
import ChallengeCard from '@/components/ChallengeCard';
import CreateChallengeModal from '@/components/CreateChallengeModal';
import FriendCard from '@/components/FriendCard';
import { useChallenges } from '@/hooks/useChallenges';
import { useFriends } from '@/hooks/useFriends';
import { useSubscription } from '@/hooks/useSubscription';
import { HapticNotify, hapticNotify } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/theme';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

export default function SocialScreen() {
  const router = useRouter();
  const { isPremium } = useSubscription();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [addFriendVisible, setAddFriendVisible] = useState(false);
  const [challengeVisible, setChallengeVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    friends,
    pendingIncoming,
    pendingOutgoing,
    connectedUserIds,
    loading: friendsLoading,
    actionLoading: friendsActionLoading,
    error: friendsError,
    fetchFriends,
    searchUsers,
    sendFriendRequest,
    respondToRequest,
    cancelRequest,
    removeFriend,
  } = useFriends();

  const {
    activeChallenges,
    pastChallenges,
    loading: challengesLoading,
    actionLoading: challengesActionLoading,
    error: challengesError,
    fetchChallenges,
    createChallenge,
    completeChallenge,
    cancelChallenge,
  } = useChallenges();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });
  }, []);

  const loading = friendsLoading || challengesLoading;
  const friendsLoadError = friendsError;
  const challengesLoadError = challengesError;

  useEffect(() => {
    if (friendsLoadError) {
      console.error('[Keva Social] friendsError:', friendsLoadError);
      hapticNotify(HapticNotify.Error);
    }
    if (challengesLoadError) {
      console.error('[Keva Social] challengesError:', challengesLoadError);
      hapticNotify(HapticNotify.Error);
    }
  }, [friendsLoadError, challengesLoadError]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchFriends(), fetchChallenges()]);
    setRefreshing(false);
  }, [fetchFriends, fetchChallenges]);

  function openCreateChallenge() {
    if (!isPremium) {
      router.push('/paywall' as Href);
      return;
    }
    setChallengeVisible(true);
  }

  function confirmRemoveFriend(friendId: string, username: string) {
    Alert.alert('Remove friend', `Remove ${username} from your friends?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeFriend(friendId),
      },
    ]);
  }

  function confirmCancelChallenge(challengeId: string) {
    Alert.alert('Cancel challenge', 'End this challenge early?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel challenge',
        style: 'destructive',
        onPress: () => cancelChallenge(challengeId),
      },
    ]);
  }

  if (loading && friends.length === 0 && activeChallenges.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        <Text style={styles.title}>Social</Text>
        <Text style={styles.subtitle}>
          See friend streaks and run challenges — habit names stay private.
        </Text>

        <View style={styles.actionRow}>
          <Pressable style={styles.primaryButton} onPress={() => setAddFriendVisible(true)}>
            <Text style={styles.primaryButtonText}>Add friend</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={openCreateChallenge}>
            <Text style={styles.secondaryButtonText}>
              {isPremium ? 'New challenge' : 'Challenge (Premium)'}
            </Text>
          </Pressable>
        </View>

        {pendingIncoming.length > 0 ? (
          <Section title="FRIEND REQUESTS">
            {pendingIncoming.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <Text style={styles.requestName}>{request.username}</Text>
                <View style={styles.requestActions}>
                  <Pressable
                    onPress={() => respondToRequest(request.id, true)}
                    disabled={friendsActionLoading}
                  >
                    <Text style={styles.acceptText}>Accept</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => respondToRequest(request.id, false)}
                    disabled={friendsActionLoading}
                  >
                    <Text style={styles.declineText}>Decline</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </Section>
        ) : null}

        {pendingOutgoing.length > 0 ? (
          <Section title="SENT REQUESTS">
            {pendingOutgoing.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <Text style={styles.requestName}>{request.username}</Text>
                <Pressable
                  onPress={() => cancelRequest(request.id)}
                  disabled={friendsActionLoading}
                >
                  <Text style={styles.declineText}>Cancel</Text>
                </Pressable>
              </View>
            ))}
          </Section>
        ) : null}

        <Section title="FRIENDS">
          {friends.length === 0 ? (
            <Text style={styles.emptyText}>
              No friends yet. Search by username to connect.
            </Text>
          ) : (
            friends.map((friend) => (
              <FriendCard
                key={friend.user_id}
                friend={friend}
                onRemove={() => confirmRemoveFriend(friend.user_id, friend.username)}
              />
            ))
          )}
        </Section>

        <Section title="ACTIVE CHALLENGES">
          {activeChallenges.length === 0 ? (
            <Text style={styles.emptyText}>
              {isPremium
                ? 'Start a challenge with a friend to stay accountable.'
                : 'Upgrade to Premium to create friend challenges.'}
            </Text>
          ) : currentUserId ? (
            activeChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                currentUserId={currentUserId}
                onComplete={() => completeChallenge(challenge.id)}
                onCancel={() => confirmCancelChallenge(challenge.id)}
              />
            ))
          ) : null}
        </Section>

        {pastChallenges.length > 0 && currentUserId ? (
          <Section title="PAST CHALLENGES">
            {pastChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                currentUserId={currentUserId}
              />
            ))}
          </Section>
        ) : null}

        {friendsLoadError ? (
          <Text style={styles.error}>Friends: {friendsLoadError}</Text>
        ) : null}
        {challengesLoadError ? (
          <Text style={styles.error}>Challenges: {challengesLoadError}</Text>
        ) : null}
      </ScrollView>

      <AddFriendModal
        visible={addFriendVisible}
        loading={friendsActionLoading}
        onSearch={searchUsers}
        onSendRequest={sendFriendRequest}
        onClose={() => setAddFriendVisible(false)}
        existingFriendIds={connectedUserIds}
      />

      <CreateChallengeModal
        visible={challengeVisible}
        friends={friends}
        loading={challengesActionLoading}
        onCreate={createChallenge}
        onClose={() => setChallengeVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  scroll: {
    gap: 4,
    paddingBottom: 40,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  centered: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    flex: 1,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: colors.text,
    fontFamily: fonts.label,
    fontSize: 13,
    textAlign: 'center',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  sectionContent: {
    gap: 10,
  },
  requestCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  requestName: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: '600',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 16,
  },
  acceptText: {
    color: colors.accent3,
    fontFamily: fonts.label,
    fontSize: 13,
  },
  declineText: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 13,
  },
  emptyText: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 13,
    lineHeight: 18,
    padding: 16,
  },
  error: {
    color: colors.accent2,
    fontFamily: fonts.label,
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
  },
});
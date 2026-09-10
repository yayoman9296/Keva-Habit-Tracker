import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getFriendUserId, isIncomingRequest, isOutgoingRequest } from '@/lib/social';
import {
  getSupabaseErrorCode,
  getSupabaseErrorMessage,
  logSupabaseError,
} from '@/lib/supabaseErrors';
import { supabase } from '@/lib/supabase';
import type {
  FriendSummary,
  FriendshipRow,
  ProfileRow,
  UserSearchResult,
} from '@/lib/types';

type PendingFriend = FriendshipRow & {
  username: string;
};

async function getAuthenticatedUserId(): Promise<string | null> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    logSupabaseError('getSession failed', sessionError);
  }

  const sessionUserId = sessionData.session?.user?.id ?? null;
  if (sessionUserId) {
    return sessionUserId;
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) {
    logSupabaseError('getUser failed', userError);
    return null;
  }

  return userData.user?.id ?? null;
}

async function loadFriendships(userId: string): Promise<FriendshipRow[]> {
  const [requesterResult, addresseeResult] = await Promise.all([
    supabase.from('friendships').select('*').eq('requester_id', userId),
    supabase.from('friendships').select('*').eq('addressee_id', userId),
  ]);

  if (requesterResult.error) {
    logSupabaseError('friendships requester query failed', requesterResult.error);
    throw requesterResult.error;
  }

  if (addresseeResult.error) {
    logSupabaseError('friendships addressee query failed', addresseeResult.error);
    throw addresseeResult.error;
  }

  const merged = [...(requesterResult.data ?? []), ...(addresseeResult.data ?? [])] as FriendshipRow[];
  const byId = new Map<string, FriendshipRow>();

  for (const friendship of merged) {
    byId.set(friendship.id, friendship);
  }

  return [...byId.values()];
}

async function loadProfiles(userIds: string[]): Promise<Record<string, string>> {
  if (userIds.length === 0) return {};

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', userIds);

  if (profilesError) {
    logSupabaseError('profiles query failed', profilesError);
    throw profilesError;
  }

  return (profiles ?? []).reduce<Record<string, string>>((acc, profile) => {
    const row = profile as Pick<ProfileRow, 'id' | 'username'>;
    acc[row.id] = row.username ?? 'User';
    return acc;
  }, {});
}

async function buildFriendSummariesFromFriendships(
  userId: string,
  friendships: FriendshipRow[],
): Promise<FriendSummary[]> {
  const accepted = friendships.filter((f) => f.status === 'accepted');
  if (accepted.length === 0) return [];

  const friendIds = [...new Set(accepted.map((f) => getFriendUserId(f, userId)))];
  const usernames = await loadProfiles(friendIds);

  return friendIds.map((friendId) => ({
    user_id: friendId,
    username: usernames[friendId] ?? 'User',
    current_streak: 0,
    completed_today: false,
    active_habits_count: 0,
  }));
}

async function tryLoadFriendSummariesFromRpc(): Promise<FriendSummary[] | null> {
  const { data, error } = await supabase.rpc('get_friend_summaries', {});

  if (!error) {
    return (data ?? []) as FriendSummary[];
  }

  logSupabaseError('get_friend_summaries RPC failed (non-fatal)', error);
  console.warn(
    '[Keva Social] Using basic friend list fallback.',
    getSupabaseErrorCode(error) ?? 'unknown',
    getSupabaseErrorMessage(error, 'RPC failed'),
  );
  return null;
}

export function useFriends() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<PendingFriend[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<PendingFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  const fetchFriends = useCallback(async () => {
    const fetchId = ++fetchIdRef.current;
    const isStale = () => fetchId !== fetchIdRef.current;

    setLoading(true);
    setError(null);

    try {
      const userId = await getAuthenticatedUserId();
      if (isStale()) return;

      if (!userId) {
        console.warn('[Keva Social] fetchFriends skipped — no authenticated user');
        setCurrentUserId(null);
        setFriends([]);
        setPendingIncoming([]);
        setPendingOutgoing([]);
        return;
      }

      setCurrentUserId(userId);

      const friendships = await loadFriendships(userId);
      if (isStale()) return;

      const pending = friendships.filter((f) => f.status === 'pending');
      let summaries = await buildFriendSummariesFromFriendships(userId, friendships);
      if (isStale()) return;

      const rpcSummaries = await tryLoadFriendSummariesFromRpc();
      if (!isStale() && rpcSummaries !== null) {
        summaries = rpcSummaries;
      }

      setFriends(summaries);

      const profileIds = [...new Set(pending.map((f) => getFriendUserId(f, userId)))];
      const profilesById = await loadProfiles(profileIds);
      if (isStale()) return;

      const incoming: PendingFriend[] = [];
      const outgoing: PendingFriend[] = [];

      for (const friendship of pending) {
        const friendId = getFriendUserId(friendship, userId);
        const enriched: PendingFriend = {
          ...friendship,
          username: profilesById[friendId] ?? 'User',
        };

        if (isIncomingRequest(friendship, userId)) {
          incoming.push(enriched);
        } else if (isOutgoingRequest(friendship, userId)) {
          outgoing.push(enriched);
        }
      }

      setPendingIncoming(incoming);
      setPendingOutgoing(outgoing);
    } catch (err) {
      if (isStale()) return;
      logSupabaseError('fetchFriends failed', err);
      setError(getSupabaseErrorMessage(err, 'Failed to load friends'));
    } finally {
      if (!isStale()) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchFriends();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        void fetchFriends();
        return;
      }

      if (event === 'SIGNED_OUT') {
        fetchIdRef.current += 1;
        setCurrentUserId(null);
        setFriends([]);
        setPendingIncoming([]);
        setPendingOutgoing([]);
        setLoading(false);
        setError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchFriends]);

  const searchUsers = useCallback(async (query: string): Promise<UserSearchResult[]> => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    const { data, error: searchError } = await supabase.rpc('search_users_by_username', {
      search_query: trimmed,
    });

    if (searchError) {
      logSupabaseError('search_users_by_username RPC failed', searchError);
      throw searchError;
    }

    return (data ?? []) as UserSearchResult[];
  }, []);

  const sendFriendRequest = useCallback(
    async (addresseeId: string) => {
      if (!currentUserId) return;

      setActionLoading(true);
      setError(null);

      try {
        const { error: insertError } = await supabase.from('friendships').insert({
          requester_id: currentUserId,
          addressee_id: addresseeId,
          status: 'pending',
        });

        if (insertError) throw insertError;
        await fetchFriends();
      } catch (err) {
        logSupabaseError('sendFriendRequest failed', err);
        setError(getSupabaseErrorMessage(err, 'Failed to send friend request'));
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [currentUserId, fetchFriends],
  );

  const respondToRequest = useCallback(
    async (friendshipId: string, accept: boolean) => {
      setActionLoading(true);
      setError(null);

      try {
        const { error: updateError } = await supabase
          .from('friendships')
          .update({ status: accept ? 'accepted' : 'rejected' })
          .eq('id', friendshipId);

        if (updateError) throw updateError;
        await fetchFriends();
      } catch (err) {
        logSupabaseError('respondToRequest failed', err);
        setError(getSupabaseErrorMessage(err, 'Failed to respond to request'));
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchFriends],
  );

  const cancelRequest = useCallback(
    async (friendshipId: string) => {
      setActionLoading(true);
      setError(null);

      try {
        const { error: deleteError } = await supabase
          .from('friendships')
          .delete()
          .eq('id', friendshipId);

        if (deleteError) throw deleteError;
        await fetchFriends();
      } catch (err) {
        logSupabaseError('cancelRequest failed', err);
        setError(getSupabaseErrorMessage(err, 'Failed to cancel request'));
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchFriends],
  );

  const removeFriend = useCallback(
    async (friendUserId: string) => {
      if (!currentUserId) return;

      setActionLoading(true);
      setError(null);

      try {
        const { error: deleteError } = await supabase
          .from('friendships')
          .delete()
          .or(
            `and(requester_id.eq.${currentUserId},addressee_id.eq.${friendUserId}),and(requester_id.eq.${friendUserId},addressee_id.eq.${currentUserId})`,
          )
          .eq('status', 'accepted');

        if (deleteError) throw deleteError;
        await fetchFriends();
      } catch (err) {
        logSupabaseError('removeFriend failed', err);
        setError(getSupabaseErrorMessage(err, 'Failed to remove friend'));
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [currentUserId, fetchFriends],
  );

  const acceptedFriendIds = useMemo(
    () => new Set(friends.map((friend) => friend.user_id)),
    [friends],
  );

  const connectedUserIds = useMemo(() => {
    const ids = new Set(acceptedFriendIds);
    if (!currentUserId) return ids;

    for (const request of [...pendingIncoming, ...pendingOutgoing]) {
      ids.add(getFriendUserId(request, currentUserId));
    }

    return ids;
  }, [acceptedFriendIds, currentUserId, pendingIncoming, pendingOutgoing]);

  return {
    friends,
    pendingIncoming,
    pendingOutgoing,
    acceptedFriendIds,
    connectedUserIds,
    loading,
    actionLoading,
    error,
    fetchFriends,
    searchUsers,
    sendFriendRequest,
    respondToRequest,
    cancelRequest,
    removeFriend,
  };
}
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getSupabaseErrorMessage,
  logSupabaseError,
} from '@/lib/supabaseErrors';
import { supabase } from '@/lib/supabase';
import type {
  ChallengeProgress,
  ChallengeRow,
  ChallengeWithProgress,
  ProfileRow,
} from '@/lib/types';

async function fetchChallengeProgress(
  challenge: ChallengeRow,
): Promise<ChallengeProgress[]> {
  const { data, error } = await supabase.rpc('get_challenge_progress', {
    challenge_id: challenge.id,
  });

  if (!error) {
    return (data ?? []) as ChallengeProgress[];
  }

  logSupabaseError(`get_challenge_progress RPC failed for ${challenge.id} (non-fatal)`, error);

  return [
    { user_id: challenge.challenger_id, days_completed: 0 },
    { user_id: challenge.challenged_id, days_completed: 0 },
  ];
}

async function enrichChallenges(
  challenges: ChallengeRow[],
  currentUserId: string,
): Promise<ChallengeWithProgress[]> {
  if (challenges.length === 0) return [];

  const userIds = [
    ...new Set(challenges.flatMap((c) => [c.challenger_id, c.challenged_id])),
  ];

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', userIds);

  if (profilesError) throw profilesError;

  const usernames = (profiles ?? []).reduce<Record<string, string>>((acc, profile) => {
    const row = profile as Pick<ProfileRow, 'id' | 'username'>;
    acc[row.id] = row.username ?? 'User';
    return acc;
  }, {});

  const enriched = await Promise.all(
    challenges.map(async (challenge) => {
      const progress = await fetchChallengeProgress(challenge);

      return {
        ...challenge,
        challenger_username: usernames[challenge.challenger_id] ?? 'User',
        challenged_username: usernames[challenge.challenged_id] ?? 'User',
        progress,
      };
    }),
  );

  return enriched.filter((challenge) =>
    [challenge.challenger_id, challenge.challenged_id].includes(currentUserId),
  );
}

export function useChallenges() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeChallenges, setActiveChallenges] = useState<ChallengeWithProgress[]>([]);
  const [pastChallenges, setPastChallenges] = useState<ChallengeWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);

  const fetchChallenges = useCallback(async () => {
    const fetchId = ++fetchIdRef.current;
    const isStale = () => fetchId !== fetchIdRef.current;

    setLoading(true);
    setError(null);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        logSupabaseError('getSession failed in useChallenges', sessionError);
      }

      const user =
        sessionData.session?.user ??
        (await supabase.auth.getUser()).data.user ??
        null;

      if (isStale()) return;

      if (!user) {
        console.warn('[Keva Social] fetchChallenges skipped — no authenticated user');
        setCurrentUserId(null);
        setActiveChallenges([]);
        setPastChallenges([]);
        return;
      }

      setCurrentUserId(user.id);

      const [challengerResult, challengedResult] = await Promise.all([
        supabase
          .from('challenges')
          .select('*')
          .eq('challenger_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('challenges')
          .select('*')
          .eq('challenged_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (challengerResult.error) {
        logSupabaseError('challenges challenger query failed', challengerResult.error);
        throw challengerResult.error;
      }

      if (challengedResult.error) {
        logSupabaseError('challenges challenged query failed', challengedResult.error);
        throw challengedResult.error;
      }

      const byId = new Map<string, ChallengeRow>();
      for (const row of [...(challengerResult.data ?? []), ...(challengedResult.data ?? [])]) {
        byId.set(row.id, row as ChallengeRow);
      }

      const rows = [...byId.values()].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      if (isStale()) return;

      const enriched = await enrichChallenges(rows, user.id);
      if (isStale()) return;

      setActiveChallenges(enriched.filter((c) => c.status === 'active'));
      setPastChallenges(
        enriched.filter((c) => c.status === 'completed' || c.status === 'cancelled'),
      );
    } catch (err) {
      if (isStale()) return;
      logSupabaseError('fetchChallenges failed', err);
      setError(getSupabaseErrorMessage(err, 'Failed to load challenges'));
    } finally {
      if (!isStale()) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchChallenges();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        void fetchChallenges();
        return;
      }

      if (event === 'SIGNED_OUT') {
        fetchIdRef.current += 1;
        setCurrentUserId(null);
        setActiveChallenges([]);
        setPastChallenges([]);
        setLoading(false);
        setError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchChallenges]);

  const createChallenge = useCallback(
    async (input: {
      challengedId: string;
      habitName: string;
      startDate: string;
      endDate?: string;
    }) => {
      if (!currentUserId) return;

      setActionLoading(true);
      setError(null);

      try {
        const { error: insertError } = await supabase.from('challenges').insert({
          challenger_id: currentUserId,
          challenged_id: input.challengedId,
          habit_name: input.habitName.trim(),
          start_date: input.startDate,
          end_date: input.endDate ?? null,
          status: 'active',
        });

        if (insertError) throw insertError;
        await fetchChallenges();
      } catch (err) {
        logSupabaseError('createChallenge failed', err);
        setError(getSupabaseErrorMessage(err, 'Failed to create challenge'));
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [currentUserId, fetchChallenges],
  );

  const updateChallengeStatus = useCallback(
    async (challengeId: string, status: 'completed' | 'cancelled', endDate?: string) => {
      setActionLoading(true);
      setError(null);

      try {
        const updates: Partial<ChallengeRow> = { status };
        if (endDate) {
          updates.end_date = endDate;
        }

        const { error: updateError } = await supabase
          .from('challenges')
          .update(updates)
          .eq('id', challengeId);

        if (updateError) throw updateError;
        await fetchChallenges();
      } catch (err) {
        logSupabaseError('updateChallengeStatus failed', err);
        setError(getSupabaseErrorMessage(err, 'Failed to update challenge'));
        throw err;
      } finally {
        setActionLoading(false);
      }
    },
    [fetchChallenges],
  );

  return {
    activeChallenges,
    pastChallenges,
    loading,
    actionLoading,
    error,
    fetchChallenges,
    createChallenge,
    completeChallenge: (id: string) => updateChallengeStatus(id, 'completed'),
    cancelChallenge: (id: string) => updateChallengeStatus(id, 'cancelled'),
  };
}
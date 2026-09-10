import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import type { User } from '@supabase/supabase-js';

import { useSubscription } from '@/hooks/useSubscription';
import { scheduleNotification } from '@/lib/notifications';
import { DEFAULT_NOTIFICATION_TIME } from '@/lib/time';
import { computeOverallStats } from '@/lib/stats';
import { supabase } from '@/lib/supabase';
import type { CheckinRow, HabitRow, ProfileRow } from '@/lib/types';

export type ProfileStats = {
  activeHabits: number;
  longestStreak: number;
  totalCheckins: number;
};

function formatMemberSince(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function useProfile() {
  const { isPremium } = useSubscription();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    activeHabits: 0,
    longestStreak: 0,
    totalCheckins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        setUser(null);
        setProfile(null);
        return;
      }

      setUser(currentUser);

      const [profileResult, habitsResult, checkinsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle(),
        supabase.from('habits').select('*').eq('user_id', currentUser.id),
        supabase.from('checkins').select('*').eq('user_id', currentUser.id),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (habitsResult.error) throw habitsResult.error;
      if (checkinsResult.error) throw checkinsResult.error;

      let profileRow = profileResult.data as ProfileRow | null;

      if (!profileRow) {
        const username =
          (currentUser.user_metadata?.username as string | undefined) ?? null;

        const { data: created, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: currentUser.id,
            username,
            notification_time: DEFAULT_NOTIFICATION_TIME,
            shabbat_mode: true,
          })
          .select()
          .single();

        if (createError) throw createError;
        profileRow = created as ProfileRow;
      }

      setProfile(profileRow);

      const habits = (habitsResult.data ?? []) as HabitRow[];
      const checkins = (checkinsResult.data ?? []) as CheckinRow[];
      const overall = computeOverallStats(habits, checkins);

      setStats({
        activeHabits: overall.activeHabitsCount,
        longestStreak: overall.longestStreakEver,
        totalCheckins: overall.totalCheckins,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const username = useMemo(() => {
    return (
      profile?.username ??
      (user?.user_metadata?.username as string | undefined) ??
      'User'
    );
  }, [profile, user]);

  const email = user?.email ?? '';
  const memberSince = user?.created_at ? formatMemberSince(user.created_at) : '';
  const plan = isPremium ? 'Premium' : 'Free';

  const updateNotificationTime = useCallback(async (time: string) => {
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ notification_time: time })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      setProfile(data as ProfileRow);
      await scheduleNotification(time);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notification time');
    } finally {
      setSaving(false);
    }
  }, [user]);

  const updateShabbatMode = useCallback(async (enabled: boolean) => {
    if (!user) return;

    setProfile((prev) => (prev ? { ...prev, shabbat_mode: enabled } : prev));

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ shabbat_mode: enabled })
        .eq('id', user.id);

      if (updateError) throw updateError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update Shabbat mode');
      await fetchProfile();
    }
  }, [user, fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  }, []);

  const deleteAccount = useCallback(() => {
    Alert.alert(
      'Delete account',
      'This permanently deletes your account and all habit data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            setError(null);

            try {
              const { error: deleteError } = await supabase.rpc('delete_account');
              if (deleteError) throw deleteError;

              await supabase.auth.signOut();
              router.replace('/(auth)/login');
            } catch (err) {
              setError(
                err instanceof Error ? err.message : 'Failed to delete account',
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  }, []);

  return {
    username,
    email,
    memberSince,
    plan,
    stats,
    profile,
    loading,
    saving,
    error,
    fetchProfile,
    updateNotificationTime,
    updateShabbatMode,
    signOut,
    deleteAccount,
  };
}
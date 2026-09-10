import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import TimePickerModal from '@/components/TimePickerModal';
import { useProfile } from '@/hooks/useProfile';
import { DEFAULT_NOTIFICATION_TIME, formatTimeDisplay } from '@/lib/time';
import { colors, fonts } from '@/theme';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function SettingRow({
  label,
  hint,
  value,
  onPress,
  right,
}: {
  label: string;
  hint?: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  const content = (
    <View style={styles.settingRow}>
      <View style={styles.settingText}>
        <Text style={styles.settingLabel}>{label}</Text>
        {hint ? <Text style={styles.settingHint}>{hint}</Text> : null}
      </View>
      {right ?? (value ? <Text style={styles.settingValue}>{value}</Text> : null)}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.settingPressable}>
        {content}
      </Pressable>
    );
  }

  return content;
}

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const {
    username,
    email,
    memberSince,
    plan,
    stats,
    profile,
    loading,
    saving,
    error,
    updateNotificationTime,
    updateShabbatMode,
    signOut,
    deleteAccount,
  } = useProfile();

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const notificationTime = profile?.notification_time ?? DEFAULT_NOTIFICATION_TIME;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Profile</Text>

      <View style={styles.userCard}>
        <View style={styles.userHeader}>
          <Text style={styles.username}>{username}</Text>
          <View style={[styles.planBadge, plan === 'Premium' && styles.planBadgePremium]}>
            <Text style={styles.planBadgeText}>{plan}</Text>
          </View>
        </View>
        <Text style={styles.email}>{email}</Text>
        {memberSince ? (
          <Text style={styles.memberSince}>Member since {memberSince}</Text>
        ) : null}
      </View>

      <Section title="STATS">
        <View style={styles.statsRow}>
          <StatItem value={stats.activeHabits} label="Active habits" />
          <StatItem value={stats.longestStreak} label="Longest streak" />
          <StatItem value={stats.totalCheckins} label="Check-ins" />
        </View>
      </Section>

      <Section title="SETTINGS">
        <SettingRow
          label="Notification time"
          hint="Daily reminder"
          value={formatTimeDisplay(notificationTime)}
          onPress={() => setTimePickerVisible(true)}
        />
        <View style={styles.divider} />
        <SettingRow
          label="Shabbat mode"
          hint="Pause check-ins during Shabbat"
          right={
            <Switch
              value={profile?.shabbat_mode ?? true}
              onValueChange={updateShabbatMode}
              trackColor={{ false: colors.surface2, true: colors.accent }}
              thumbColor={colors.text}
              disabled={saving}
            />
          }
        />
      </Section>

      <Section title="ACCOUNT">
        <Pressable style={styles.accountButton} onPress={signOut} disabled={saving}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
        <View style={styles.divider} />
        <Pressable
          style={styles.accountButton}
          onPress={deleteAccount}
          disabled={saving}
        >
          <Text style={styles.deleteText}>Delete account</Text>
        </Pressable>
      </Section>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TimePickerModal
        visible={timePickerVisible}
        selectedTime={notificationTime}
        onSelect={updateNotificationTime}
        onClose={() => setTimePickerVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  scroll: {
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
    marginBottom: 24,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  userHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  username: {
    color: colors.text,
    flex: 1,
    fontFamily: fonts.heading,
    fontSize: 24,
    fontWeight: '700',
  },
  planBadge: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  planBadgePremium: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  planBadgeText: {
    color: colors.text,
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  email: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 14,
    marginTop: 8,
  },
  memberSince: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    color: colors.accent,
    fontFamily: fonts.heading,
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 11,
    marginTop: 4,
  },
  settingPressable: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingText: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: '600',
  },
  settingHint: {
    color: colors.muted,
    fontFamily: fonts.label,
    fontSize: 12,
    marginTop: 2,
  },
  settingValue: {
    color: colors.accent,
    fontFamily: fonts.label,
    fontSize: 14,
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
    marginHorizontal: 16,
  },
  accountButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  signOutText: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteText: {
    color: colors.accent2,
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  error: {
    color: colors.accent2,
    fontFamily: fonts.label,
    fontSize: 13,
    marginTop: 16,
    textAlign: 'center',
  },
});
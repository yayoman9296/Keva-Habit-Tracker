export type HabitRow = {
  id: string;
  user_id: string;
  name: string;
  is_private: boolean;
  created_at: string;
};

export type CheckinRow = {
  id: string;
  habit_id: string;
  user_id: string;
  checked_date: string;
  created_at: string;
};

export type HabitWithStreaks = HabitRow & {
  currentStreak: number;
  bestStreak: number;
  completedToday: boolean;
  checkinDates: string[];
};

export type SuggestedHabit = {
  name: string;
  is_private: boolean;
};

export type ProfileRow = {
  id: string;
  username: string | null;
  notification_time: string;
  shabbat_mode: boolean;
  created_at: string;
};

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected';

export type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
};

export type ChallengeStatus = 'active' | 'completed' | 'cancelled';

export type ChallengeRow = {
  id: string;
  challenger_id: string;
  challenged_id: string;
  habit_name: string;
  start_date: string;
  end_date: string | null;
  status: ChallengeStatus;
  created_at: string;
};

export type FriendSummary = {
  user_id: string;
  username: string;
  current_streak: number;
  completed_today: boolean;
  active_habits_count: number;
};

export type UserSearchResult = {
  id: string;
  username: string;
};

export type ChallengeProgress = {
  user_id: string;
  days_completed: number;
};

export type ChallengeWithProgress = ChallengeRow & {
  challenger_username: string;
  challenged_username: string;
  progress: ChallengeProgress[];
};
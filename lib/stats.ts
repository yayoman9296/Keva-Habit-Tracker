import { addDays, getLastNDays, parseLocalDate, toLocalDateString } from '@/lib/dates';
import { calculateStreaks } from '@/lib/streaks';
import type { CheckinRow, HabitRow } from '@/lib/types';

export type OverallStats = {
  longestStreakEver: number;
  totalCheckins: number;
  activeHabitsCount: number;
  bestCompletionWeek: number;
};

export type HabitStat = {
  id: string;
  name: string;
  currentStreak: number;
  bestStreak: number;
  completionRate30d: number;
  weekCompletion: boolean[];
  weekLabels: string[];
};

export type HeatmapDay = {
  date: string;
  dayOfMonth: number;
  completedCount: number;
};

function countsByDate(checkins: CheckinRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const checkin of checkins) {
    map.set(checkin.checked_date, (map.get(checkin.checked_date) ?? 0) + 1);
  }
  return map;
}

export function computeBestCompletionWeek(checkins: CheckinRow[]): number {
  if (checkins.length === 0) return 0;

  const byDate = countsByDate(checkins);
  const today = toLocalDateString();
  const earliest = [...byDate.keys()].sort()[0];
  let best = 0;
  let windowStart = earliest;

  while (windowStart <= today) {
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const day = addDays(windowStart, i);
      if (day > today) break;
      total += byDate.get(day) ?? 0;
    }
    best = Math.max(best, total);
    windowStart = addDays(windowStart, 1);
  }

  return best;
}

export function computeCompletionRate30d(checkinDates: string[]): number {
  const last30 = getLastNDays(30);
  const dateSet = new Set(checkinDates);
  const completed = last30.filter((date) => dateSet.has(date)).length;
  return Math.round((completed / 30) * 100);
}

export function computeOverallStats(
  habits: HabitRow[],
  checkins: CheckinRow[],
  today: string = toLocalDateString(),
  isFrozenDay?: (dateStr: string) => boolean,
): OverallStats {
  const checkinsByHabit = checkins.reduce<Record<string, string[]>>((acc, checkin) => {
    if (!acc[checkin.habit_id]) acc[checkin.habit_id] = [];
    acc[checkin.habit_id].push(checkin.checked_date);
    return acc;
  }, {});

  let longestStreakEver = 0;
  for (const habit of habits) {
    const dates = checkinsByHabit[habit.id] ?? [];
    const { best } = calculateStreaks(dates, today, isFrozenDay);
    longestStreakEver = Math.max(longestStreakEver, best);
  }

  return {
    longestStreakEver,
    totalCheckins: checkins.length,
    activeHabitsCount: habits.length,
    bestCompletionWeek: computeBestCompletionWeek(checkins),
  };
}

export function computeHabitStats(
  habits: HabitRow[],
  checkins: CheckinRow[],
  today: string = toLocalDateString(),
  isFrozenDay?: (dateStr: string) => boolean,
): HabitStat[] {
  const checkinsByHabit = checkins.reduce<Record<string, string[]>>((acc, checkin) => {
    if (!acc[checkin.habit_id]) acc[checkin.habit_id] = [];
    acc[checkin.habit_id].push(checkin.checked_date);
    return acc;
  }, {});

  const last7 = getLastNDays(7);
  const weekLabels = last7.map((date) => {
    const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return labels[parseLocalDate(date).getDay()];
  });

  return habits.map((habit) => {
    const dates = checkinsByHabit[habit.id] ?? [];
    const dateSet = new Set(dates);
    const { current, best } = calculateStreaks(dates, today, isFrozenDay);

    return {
      id: habit.id,
      name: habit.name,
      currentStreak: current,
      bestStreak: best,
      completionRate30d: computeCompletionRate30d(dates),
      weekCompletion: last7.map((date) => dateSet.has(date)),
      weekLabels,
    };
  });
}

export function computeHeatmap(
  checkins: CheckinRow[],
  days: number = 30,
): HeatmapDay[] {
  const byDate = countsByDate(checkins);
  const lastNDays = getLastNDays(days);

  return lastNDays.map((date) => ({
    date,
    dayOfMonth: parseLocalDate(date).getDate(),
    completedCount: byDate.get(date) ?? 0,
  }));
}
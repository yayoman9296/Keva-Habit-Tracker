import { daysBetween, toLocalDateString } from '@/lib/dates';

export const HABIT_SWAP_MIN_DAYS = 7;

export function getHabitActiveDays(
  createdAt: string,
  today: string = toLocalDateString(),
): number {
  const createdDate = toLocalDateString(new Date(createdAt));
  return daysBetween(createdDate, today);
}

export function canSwapHabit(createdAt: string, today: string = toLocalDateString()): boolean {
  return getHabitActiveDays(createdAt, today) >= HABIT_SWAP_MIN_DAYS;
}
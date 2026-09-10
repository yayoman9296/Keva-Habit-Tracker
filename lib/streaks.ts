import { addDays, parseLocalDate, toLocalDateString } from '@/lib/dates';

// Shabbos always runs from Friday candle-lighting to Saturday nightfall, so the
// dates it covers are that week's Friday and Saturday. When Shabbat Mode is on
// these days are "frozen": the app is locked, no check-in is possible, and a
// missing check-in must not break (or reset) the streak.
export function isShabbosDate(dateStr: string): boolean {
  const day = parseLocalDate(dateStr).getDay();
  return day === 5 || day === 6;
}

// True when every calendar day strictly between `prev` and `curr` is frozen —
// i.e. the two check-ins are consecutive once Shabbos days are ignored. With the
// default (no-op) predicate this reduces to "prev and curr are adjacent days".
function bridgedByFrozenDays(
  prev: string,
  curr: string,
  isFrozenDay: (dateStr: string) => boolean,
): boolean {
  let cursor = addDays(prev, 1);
  while (cursor < curr) {
    if (!isFrozenDay(cursor)) return false;
    cursor = addDays(cursor, 1);
  }
  return true;
}

export function calculateStreaks(
  checkinDates: string[],
  todayLocal: string = toLocalDateString(),
  isFrozenDay: (dateStr: string) => boolean = () => false,
): { current: number; best: number } {
  if (checkinDates.length === 0) {
    return { current: 0, best: 0 };
  }

  const uniqueDates = [...new Set(checkinDates)].sort();
  let best = 1;
  let run = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    // A gap made up entirely of frozen (Shabbos) days doesn't break the run.
    if (bridgedByFrozenDays(uniqueDates[i - 1], uniqueDates[i], isFrozenDay)) {
      run += 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
  }

  const dateSet = new Set(uniqueDates);
  let current = 0;
  let cursor = todayLocal;

  // Grace: an un-checked-in *today* doesn't break the streak yet.
  if (!dateSet.has(cursor) && cursor === todayLocal) {
    cursor = addDays(cursor, -1);
  }

  // Walk backward, counting check-ins and passing through frozen Shabbos days
  // (neither counted nor treated as a miss) so the streak freezes over Shabbos
  // and resumes from where it left off once Shabbos ends.
  while (dateSet.has(cursor) || isFrozenDay(cursor)) {
    if (dateSet.has(cursor)) current += 1;
    cursor = addDays(cursor, -1);
  }

  return { current, best };
}

export function maxCurrentStreak(
  habits: { currentStreak: number }[],
): number {
  if (habits.length === 0) return 0;
  return Math.max(...habits.map((h) => h.currentStreak));
}
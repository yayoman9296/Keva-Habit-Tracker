export function todayISO(): string {
  return toISODate(new Date())
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** Shabbos runs Friday sundown to Saturday nightfall; treated at day granularity as Fri + Sat. */
export function isShabbos(date: Date = new Date()): boolean {
  const day = date.getDay()
  return day === 5 || day === 6
}

/**
 * Computes the current streak (consecutive days up to today) from a list of
 * ISO completion dates. Shabbos and Yom Tov are not implemented as skip days
 * yet — see README roadmap.
 */
export function computeStreak(completions: string[]): number {
  const completed = new Set(completions)
  let streak = 0
  const cursor = new Date()

  while (completed.has(toISODate(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

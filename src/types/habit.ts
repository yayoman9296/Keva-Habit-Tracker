export type HabitCategory = 'learning' | 'tefillah' | 'chessed' | 'personal-growth'

export interface Habit {
  id: string
  name: string
  category: HabitCategory
  createdAt: string
  /** ISO date strings (yyyy-mm-dd) on which this habit was completed. */
  completions: string[]
}

export const CATEGORY_LABELS: Record<HabitCategory, string> = {
  learning: 'Learning',
  tefillah: 'Tefillah',
  chessed: 'Chessed',
  'personal-growth': 'Personal Growth',
}

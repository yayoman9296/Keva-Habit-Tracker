import { CATEGORY_LABELS, type Habit } from '../types/habit'
import { computeStreak, todayISO } from '../utils/date'
import { StreakBadge } from './StreakBadge'

interface HabitCardProps {
  habit: Habit
  onToggleToday: (id: string) => void
  onRemove: (id: string) => void
}

export function HabitCard({ habit, onToggleToday, onRemove }: HabitCardProps) {
  const doneToday = habit.completions.includes(todayISO())
  const streak = computeStreak(habit.completions)

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-keva-navy/10 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-1 items-center gap-3">
        <button
          type="button"
          onClick={() => onToggleToday(habit.id)}
          aria-pressed={doneToday}
          aria-label={doneToday ? 'Mark as not done today' : 'Mark as done today'}
          className={`h-6 w-6 shrink-0 rounded-full border-2 transition ${
            doneToday
              ? 'border-keva-gold bg-keva-gold'
              : 'border-keva-navy/30 bg-transparent'
          }`}
        />
        <div>
          <p className="font-medium text-keva-navy">{habit.name}</p>
          <p className="text-xs uppercase tracking-wide text-keva-navy/40">
            {CATEGORY_LABELS[habit.category]}
          </p>
        </div>
      </div>
      <StreakBadge streak={streak} />
      <button
        type="button"
        onClick={() => onRemove(habit.id)}
        aria-label={`Remove ${habit.name}`}
        className="text-keva-navy/30 transition hover:text-red-500"
      >
        ✕
      </button>
    </li>
  )
}

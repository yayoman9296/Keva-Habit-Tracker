interface StreakBadgeProps {
  streak: number
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak === 0) {
    return <span className="text-sm text-keva-navy/40">No streak yet</span>
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-keva-gold/20 px-2 py-0.5 text-sm font-medium text-keva-navy">
      🔥 {streak} day{streak === 1 ? '' : 's'}
    </span>
  )
}

import { useState } from 'react'
import type { FormEvent } from 'react'
import { CATEGORY_LABELS, type HabitCategory } from '../types/habit'

interface HabitFormProps {
  onAdd: (name: string, category: HabitCategory) => void
}

export function HabitForm({ onAdd }: HabitFormProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<HabitCategory>('learning')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed, category)
    setName('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Daf Yomi, Mincha, call a friend..."
        className="flex-1 rounded-lg border border-keva-navy/20 bg-white px-3 py-2 text-keva-navy placeholder:text-keva-navy/40 focus:outline-none focus:ring-2 focus:ring-keva-gold"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as HabitCategory)}
        className="rounded-lg border border-keva-navy/20 bg-white px-3 py-2 text-keva-navy focus:outline-none focus:ring-2 focus:ring-keva-gold"
      >
        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-lg bg-keva-navy px-4 py-2 font-medium text-keva-cream transition hover:bg-keva-navy/90"
      >
        Add Habit
      </button>
    </form>
  )
}

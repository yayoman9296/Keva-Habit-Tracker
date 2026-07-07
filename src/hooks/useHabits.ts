import { useCallback, useEffect, useState } from 'react'
import type { Habit, HabitCategory } from '../types/habit'
import { todayISO } from '../utils/date'

const STORAGE_KEY = 'keva.habits'

function loadHabits(): Habit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Habit[]) : []
  } catch {
    return []
  }
}

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>(loadHabits)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits))
  }, [habits])

  const addHabit = useCallback((name: string, category: HabitCategory) => {
    const habit: Habit = {
      id: crypto.randomUUID(),
      name,
      category,
      createdAt: todayISO(),
      completions: [],
    }
    setHabits((prev) => [...prev, habit])
  }, [])

  const removeHabit = useCallback((id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id))
  }, [])

  const toggleToday = useCallback((id: string) => {
    const today = todayISO()
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h
        const hasToday = h.completions.includes(today)
        return {
          ...h,
          completions: hasToday
            ? h.completions.filter((d) => d !== today)
            : [...h.completions, today],
        }
      }),
    )
  }, [])

  return { habits, addHabit, removeHabit, toggleToday }
}

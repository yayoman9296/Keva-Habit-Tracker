import { HabitCard } from '../components/HabitCard'
import { HabitForm } from '../components/HabitForm'
import { useHabits } from '../hooks/useHabits'

export function Dashboard() {
  const { habits, addHabit, removeHabit, toggleToday } = useHabits()

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-keva-navy">Add a habit</h2>
        <HabitForm onAdd={addHabit} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-keva-navy">Today</h2>
        {habits.length === 0 ? (
          <p className="rounded-xl border border-dashed border-keva-navy/20 px-4 py-8 text-center text-keva-navy/50">
            No habits yet. Add your first one above to start building keva.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onToggleToday={toggleToday}
                onRemove={removeHabit}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

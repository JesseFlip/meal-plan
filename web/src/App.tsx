import { usePlanSync } from './hooks/usePlanSync'
import { PlanGrid } from './components/PlanGrid'
import { SyncStatus } from './components/SyncStatus'

function weekRangeLabel(): string {
  const now = new Date()
  const day = now.getDay() // 0=Sun
  const monOffset = day === 0 ? -6 : 1 - day
  const mon = new Date(now)
  mon.setDate(now.getDate() + monOffset)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${fmt(mon)} – ${fmt(sun)}`
}

export default function App() {
  const { slots, connected, updateSlot } = usePlanSync()

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-10 bg-stone-50/95 backdrop-blur border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">Meal Plan</h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">Week of {weekRangeLabel()}</p>
          </div>
          <SyncStatus connected={connected} />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <PlanGrid slots={slots} onUpdate={updateSlot} />
        <footer className="mt-6 text-center text-xs text-stone-400">
          tap any cell to edit · changes sync live across devices
        </footer>
      </main>
    </div>
  )
}

import { useState } from 'react'
import { usePlanSync } from './hooks/usePlanSync'
import { useTranslation } from './hooks/useTranslation'
import { useMealHistory } from './hooks/useMealHistory'
import { PlanGrid } from './components/PlanGrid'
import { GroceryView } from './components/GroceryView'
import { SyncStatus } from './components/SyncStatus'
import { LanguageSwitcher } from './components/LanguageSwitcher'

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

type View = 'plan' | 'groceries'

export default function App() {
  const [currentView, setCurrentView] = useState<View>('plan')
  const { t } = useTranslation()
  const { meals } = useMealHistory()

  const {
    slots,
    connected,
    updateSlot,
    syncMode,
    setSyncMode,
    pendingCount,
    pendingSlotIds,
    flush
  } = usePlanSync()

  const handleSyncToggle = () => {
    if (syncMode === 'auto') {
      setSyncMode('manual')
    } else if (pendingCount > 0) {
      flush().then(() => setSyncMode('auto'))
    } else {
      setSyncMode('auto')
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-10 bg-stone-50/95 backdrop-blur border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">{t('app.title')}</h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">{t('app.weekOf')} {weekRangeLabel()}</p>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              {currentView === 'plan' && (
                <SyncStatus
                  connected={connected}
                  syncMode={syncMode}
                  pendingCount={pendingCount}
                  onToggle={handleSyncToggle}
                />
              )}
            </div>
          </div>

          {/* View Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentView('plan')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                currentView === 'plan'
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-white text-stone-600 hover:bg-stone-100'
              }`}
            >
              {t('nav.mealPlan')}
            </button>
            <button
              onClick={() => setCurrentView('groceries')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                currentView === 'groceries'
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-white text-stone-600 hover:bg-stone-100'
              }`}
            >
              {t('nav.groceries')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {currentView === 'plan' ? (
          <>
            <PlanGrid slots={slots} onUpdate={updateSlot} pendingSlotIds={pendingSlotIds} mealHistory={meals} />
            <footer className="mt-6 text-center text-xs text-stone-400">
              {t('footer.hint')}
            </footer>
          </>
        ) : (
          <GroceryView />
        )}
      </main>
    </div>
  )
}

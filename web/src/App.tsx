import { useState, useEffect } from 'react'
import { usePlanSync } from './hooks/usePlanSync'
import { useTranslation } from './hooks/useTranslation'
import { useSettings } from './hooks/useSettings'
import { PlanGrid } from './components/PlanGrid'
import { GroceryView } from './components/GroceryView'
import { SyncStatus } from './components/SyncStatus'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { ColorPicker } from './components/ColorPicker'
import { NightModeToggle } from './components/NightModeToggle'
import { FoodOptionsProvider } from './contexts/FoodOptionsContext'

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
  const { handwritingColor, nightMode, updateNightMode } = useSettings()

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

  // Apply dynamic handwriting color via CSS custom property
  useEffect(() => {
    document.documentElement.style.setProperty('--handwriting-color', handwritingColor)
  }, [handwritingColor])

  // Apply dark mode class
  useEffect(() => {
    if (nightMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [nightMode])

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
    <FoodOptionsProvider>
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 transition-colors">
        <header className="sticky top-0 z-10 bg-stone-50/95 dark:bg-stone-900/95 backdrop-blur border-b border-stone-200 dark:border-stone-700">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">{t('app.title')}</h1>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">{t('app.weekOf')} {weekRangeLabel()}</p>
              </div>
              <div className="flex items-center gap-3">
                <ColorPicker />
                <NightModeToggle nightMode={nightMode} onToggle={updateNightMode} />
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
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                }`}
              >
                {t('nav.mealPlan')}
              </button>
              <button
                onClick={() => setCurrentView('groceries')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                  currentView === 'groceries'
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
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
              <PlanGrid slots={slots} onUpdate={updateSlot} pendingSlotIds={pendingSlotIds} />
              <footer className="mt-6 text-center text-xs text-stone-400 dark:text-stone-500">
                {t('footer.hint')}
              </footer>
            </>
          ) : (
            <GroceryView />
          )}
        </main>
      </div>
    </FoodOptionsProvider>
  )
}

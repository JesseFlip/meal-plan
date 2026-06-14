import { useState, useEffect, lazy, Suspense } from 'react'
import { usePlanSync } from './hooks/usePlanSync'
import { useTranslation } from './hooks/useTranslation'
import { useSettings } from './hooks/useSettings'
import { PlanGrid } from './components/PlanGrid'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { ColorPicker } from './components/ColorPicker'
import { NightModeToggle } from './components/NightModeToggle'
import { FoodOptionsProvider } from './contexts/FoodOptionsContext'
import { LanguageProvider } from './contexts/LanguageContext'

// Lazy load heavy components to reduce initial bundle size
const GroceryView = lazy(() => import('./components/GroceryView').then(m => ({ default: m.GroceryView })))
const IngredientBank = lazy(() => import('./components/IngredientBank').then(m => ({ default: m.IngredientBank })))

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

type View = 'plan' | 'groceries' | 'ingredients'

export default function App() {
  const [currentView, setCurrentView] = useState<View>('plan')
  const { t } = useTranslation()
  const { handwritingColor, nightMode, updateNightMode } = useSettings()

  const {
    slots,
    updateSlot,
    pendingSlotIds,
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

  return (
    <LanguageProvider>
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
              <button
                onClick={() => setCurrentView('ingredients')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                  currentView === 'ingredients'
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                }`}
              >
                {t('nav.ingredients')}
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
          ) : currentView === 'groceries' ? (
            <Suspense fallback={
              <div className="flex items-center justify-center py-12">
                <div className="text-stone-500 dark:text-stone-400">Loading...</div>
              </div>
            }>
              <GroceryView />
            </Suspense>
          ) : (
            <Suspense fallback={
              <div className="flex items-center justify-center py-12">
                <div className="text-stone-500 dark:text-stone-400">Loading...</div>
              </div>
            }>
              <IngredientBank />
            </Suspense>
          )}
        </main>
        </div>
      </FoodOptionsProvider>
    </LanguageProvider>
  )
}

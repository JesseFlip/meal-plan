import { useState, useEffect, lazy, Suspense } from 'react'
import { usePlanSync } from './hooks/usePlanSync'
import { useTranslation } from './hooks/useTranslation'
import { useSettings } from './hooks/useSettings'
import { PlanGrid } from './components/PlanGrid'
import { WeekPicker } from './components/WeekPicker'
import { ShareButton } from './components/ShareButton'
import { InstallPrompt } from './components/InstallPrompt'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { ColorPicker } from './components/ColorPicker'
import { NightModeToggle } from './components/NightModeToggle'
import { FoodOptionsProvider } from './contexts/FoodOptionsContext'
import { LanguageProvider } from './contexts/LanguageContext'

// Lazy load heavy components to reduce initial bundle size
const GroceryView = lazy(() => import('./components/GroceryView').then(m => ({ default: m.GroceryView })))
const IngredientBank = lazy(() => import('./components/IngredientBank').then(m => ({ default: m.IngredientBank })))

function getMondayOfWeek(dateStr?: string): string {
  const date = dateStr ? new Date(dateStr + 'T00:00:00') : new Date()
  const dayOfWeek = date.getDay()  // 0=Sun, 1=Mon, ..., 6=Sat
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(date)
  monday.setDate(date.getDate() + daysToMonday)
  return monday.toISOString().split('T')[0]
}

type View = 'plan' | 'groceries' | 'ingredients'

function AppContent() {
  const [currentView, setCurrentView] = useState<View>('plan')
  const { t } = useTranslation()
  const { handwritingColor, nightMode, updateNightMode } = useSettings()

  // Week selection with localStorage persistence
  const [selectedWeek, setSelectedWeek] = useState<string>(() => {
    const stored = localStorage.getItem('fridgeplan.selectedWeek')
    return stored || getMondayOfWeek()
  })

  const handleWeekChange = (week: string) => {
    setSelectedWeek(week)
    localStorage.setItem('fridgeplan.selectedWeek', week)
  }

  const {
    slots,
    updateSlot,
    pendingSlotIds,
  } = usePlanSync(selectedWeek)

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
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 transition-colors">
        <InstallPrompt />
        <header className="sticky top-0 z-10 bg-stone-50/95 dark:bg-stone-900/95 backdrop-blur border-b border-stone-200 dark:border-stone-700">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
            {/* Mobile: Stacked layout */}
            <div className="flex flex-col gap-3 sm:hidden">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">{t('app.title')}</h1>
                <div className="flex items-center gap-2">
                  {currentView === 'plan' && <ShareButton slots={slots} weekStartDate={selectedWeek} />}
                  <NightModeToggle nightMode={nightMode} onToggle={updateNightMode} />
                  <LanguageSwitcher />
                </div>
              </div>
              <WeekPicker selectedWeek={selectedWeek} onWeekChange={handleWeekChange} />
            </div>

            {/* Desktop: Side-by-side layout */}
            <div className="hidden sm:flex items-center justify-between mb-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 tracking-tight mb-2">{t('app.title')}</h1>
                <WeekPicker selectedWeek={selectedWeek} onWeekChange={handleWeekChange} />
              </div>
              <div className="flex items-center gap-3">
                {currentView === 'plan' && <ShareButton slots={slots} weekStartDate={selectedWeek} />}
                <ColorPicker />
                <NightModeToggle nightMode={nightMode} onToggle={updateNightMode} />
                <LanguageSwitcher />
              </div>
            </div>

            {/* View Tabs - Better touch targets on mobile */}
            <div className="flex gap-1.5 sm:gap-2 mt-3 sm:mt-0">
              <button
                onClick={() => setCurrentView('plan')}
                className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all min-h-[44px] ${
                  currentView === 'plan'
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                }`}
              >
                {t('nav.mealPlan')}
              </button>
              <button
                onClick={() => setCurrentView('groceries')}
                className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all min-h-[44px] ${
                  currentView === 'groceries'
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                }`}
              >
                {t('nav.groceries')}
              </button>
              <button
                onClick={() => setCurrentView('ingredients')}
                className={`flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all min-h-[44px] ${
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

        <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
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
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <FoodOptionsProvider>
        <AppContent />
      </FoodOptionsProvider>
    </LanguageProvider>
  )
}

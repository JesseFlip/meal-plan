import { useState, useEffect } from 'react'
import { useTranslation } from '../hooks/useTranslation'
import type { Slot } from '../hooks/usePlanSync'

const API = import.meta.env.VITE_API_URL || ''

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const SLOTS = ['Breakfast', 'Lunch', 'Dinner']

type Props = {
  shareId: string
}

function formatWeekRange(mondayStr: string): string {
  const monday = new Date(mondayStr + 'T00:00:00')
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${fmt(monday)} – ${fmt(sunday)}`
}

export function SharedPlanView({ shareId }: Props) {
  const { t } = useTranslation()
  const [slots, setSlots] = useState<Slot[]>([])
  const [weekStartDate, setWeekStartDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadSharedPlan = async () => {
      try {
        const response = await fetch(`${API}/api/shared/${shareId}`)

        if (!response.ok) {
          throw new Error('Shared meal plan not found')
        }

        const data = await response.json()
        setSlots(data.slots)
        setWeekStartDate(data.week_start_date)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load shared meal plan')
      } finally {
        setLoading(false)
      }
    }

    loadSharedPlan()
  }, [shareId])

  const getSlot = (day: number, slot: number) =>
    slots.find(s => s.day === day && s.slot === slot)

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full mb-4" />
          <p className="text-stone-600 dark:text-stone-400">Loading meal plan...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
            Meal Plan Not Found
          </h2>
          <p className="text-stone-600 dark:text-stone-400 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors"
          >
            Create Your Own Plan
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <header className="bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4">
          <div className="text-center">
            <div className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full mb-2">
              Shared Meal Plan
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 mb-1">
              {t('app.title')}
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Week of {formatWeekRange(weekStartDate)}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
        <div className="bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-x-auto scrollbar-thin mb-6">
          <div className="sm:hidden px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 text-center">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              👉 Swipe to see all days
            </p>
          </div>

          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-stone-900 text-stone-400 p-3 text-xs font-medium w-24 sm:w-28"></th>
                {DAYS.map((d, idx) => (
                  <th
                    key={d}
                    className="bg-stone-900 text-white p-3 text-xs font-bold tracking-widest text-center min-w-[120px] sm:min-w-[140px]"
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slotName, slotIdx) => (
                <tr key={slotName}>
                  <th className="bg-stone-50 dark:bg-stone-900 border-r border-stone-200 dark:border-stone-700 p-3 text-xs font-semibold text-stone-600 dark:text-stone-400 text-left uppercase tracking-wide align-top">
                    {slotName}
                  </th>
                  {DAYS.map((_, dayIdx) => {
                    const slot = getSlot(dayIdx, slotIdx)
                    const hasContent = slot && (slot.protein || slot.veggie || slot.carb_or_fat || slot.text)

                    return (
                      <td
                        key={dayIdx}
                        className="border border-stone-200 dark:border-stone-700 p-3 align-top min-h-[100px]"
                      >
                        {hasContent && (
                          <div className="space-y-1">
                            {slot.text && !slot.protein && !slot.veggie && !slot.carb_or_fat && (
                              <div className="handwritten text-sm font-medium text-stone-900 dark:text-stone-100">
                                {slot.text}
                              </div>
                            )}

                            {slot.protein && (
                              <div className="text-xs">
                                <span className="text-stone-500 dark:text-stone-400 font-medium">{t('meal.protein')}:</span>{' '}
                                <span className="handwritten text-stone-900 dark:text-stone-100">{slot.protein}</span>
                              </div>
                            )}
                            {slot.veggie && (
                              <div className="text-xs">
                                <span className="text-stone-500 dark:text-stone-400 font-medium">{t('meal.veggie')}:</span>{' '}
                                <span className="handwritten text-stone-900 dark:text-stone-100">{slot.veggie}</span>
                              </div>
                            )}
                            {slot.carb_or_fat && (
                              <div className="text-xs">
                                <span className="text-stone-500 dark:text-stone-400 font-medium">
                                  {slotIdx === 2 ? t('meal.fat') : t('meal.carb')}:
                                </span>{' '}
                                <span className="handwritten text-stone-900 dark:text-stone-100">{slot.carb_or_fat}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Your Own Meal Plan
          </a>
        </div>
      </main>
    </div>
  )
}

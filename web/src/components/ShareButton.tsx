import { useState } from 'react'
import { useTranslation } from '../hooks/useTranslation'
import type { Slot } from '../hooks/usePlanSync'

type Props = {
  slots: Slot[]
  weekStartDate: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const SLOTS = ['Breakfast', 'Lunch', 'Dinner']

function formatWeekRange(mondayStr: string): string {
  const monday = new Date(mondayStr + 'T00:00:00')
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${fmt(monday)} – ${fmt(sunday)}`
}

export function ShareButton({ slots, weekStartDate }: Props) {
  const { t } = useTranslation()
  const [showCopied, setShowCopied] = useState(false)

  const generateMealPlanText = () => {
    const weekRange = formatWeekRange(weekStartDate)
    let text = `🍽️ Meal Plan - Week of ${weekRange}\n\n`

    DAYS.forEach((day, dayIdx) => {
      const daySlots = slots.filter(s => s.day === dayIdx)
      if (daySlots.some(s => s.text || s.protein || s.veggie || s.carb_or_fat)) {
        text += `📅 ${day}\n`

        SLOTS.forEach((slotName, slotIdx) => {
          const slot = daySlots.find(s => s.slot === slotIdx)
          if (slot) {
            if (slot.text) {
              text += `  ${slotName}: ${slot.text}\n`
            } else if (slot.protein || slot.veggie || slot.carb_or_fat) {
              const parts = [slot.protein, slot.veggie, slot.carb_or_fat].filter(Boolean)
              text += `  ${slotName}: ${parts.join(', ')}\n`
            }
          }
        })
        text += '\n'
      }
    })

    text += '\n📱 Created with Meal Plan App\n'
    text += 'https://mealp.netlify.app'

    return text
  }

  const handleShare = async () => {
    const text = generateMealPlanText()

    // Try Web Share API first (mobile devices)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Meal Plan',
          text: text,
        })
      } catch (err) {
        // User cancelled or error - try clipboard fallback
        if (err instanceof Error && err.name !== 'AbortError') {
          copyToClipboard(text)
        }
      }
    } else {
      // Fallback to clipboard for desktop
      copyToClipboard(text)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium text-sm rounded-lg border border-stone-300 dark:border-stone-600 transition-colors shadow-sm"
        title={t('share.tooltip')}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        <span className="hidden sm:inline">{t('share.button')}</span>
      </button>

      {showCopied && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-stone-900 text-white text-xs rounded-lg whitespace-nowrap animate-fade-in">
          {t('share.copied')}
        </div>
      )}
    </div>
  )
}

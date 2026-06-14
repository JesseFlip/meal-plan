import { useState } from 'react'
import { useTranslation } from '../hooks/useTranslation'

type Props = {
  weekStartDate: string
}

const API = import.meta.env.VITE_API_URL || ''

const getHouseholdId = (): string | null => {
  return localStorage.getItem('fridgeplan.householdId')
}

const getHeaders = async () => {
  const householdId = getHouseholdId()
  return {
    'Content-Type': 'application/json',
    'X-Household-ID': householdId || ''
  }
}

export function ShareButton({ weekStartDate }: Props) {
  const { t } = useTranslation()
  const [isCreating, setIsCreating] = useState(false)
  const [showCopied, setShowCopied] = useState(false)

  const handleShare = async () => {
    setIsCreating(true)

    try {
      // Create shareable link
      const headers = await getHeaders()
      const response = await fetch(`${API}/api/share`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ week_start_date: weekStartDate })
      })

      if (!response.ok) {
        throw new Error('Failed to create share link')
      }

      const data = await response.json()
      const shareUrl = data.share_url

      // Try Web Share API first (mobile devices)
      if (navigator.share) {
        try {
          await navigator.share({
            title: t('share.title'),
            text: t('share.message'),
            url: shareUrl,
          })
        } catch (err) {
          // User cancelled or error - try clipboard fallback
          if (err instanceof Error && err.name !== 'AbortError') {
            await copyToClipboard(shareUrl)
          }
        }
      } else {
        // Fallback to clipboard for desktop
        await copyToClipboard(shareUrl)
      }
    } catch (error) {
      console.error('Failed to share:', error)
      alert(t('share.error'))
    } finally {
      setIsCreating(false)
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
        disabled={isCreating}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium text-sm rounded-lg border border-stone-300 dark:border-stone-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        title={t('share.tooltip')}
      >
        {isCreating ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
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
        )}
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

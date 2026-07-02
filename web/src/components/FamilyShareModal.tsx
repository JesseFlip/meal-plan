import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useTranslation } from '../hooks/useTranslation'

type Props = {
  onClose: () => void
}

const API = import.meta.env.VITE_API_URL || ''

// Convert household UUID to 6-digit PIN for easier sharing
const householdIdToPin = (householdId: string): string => {
  let hash = 0
  for (let i = 0; i < householdId.length; i++) {
    hash = ((hash << 5) - hash) + householdId.charCodeAt(i)
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString().slice(0, 6).padStart(6, '0')
}

// Generate a shareable URL with household ID
const getShareUrl = (householdId: string): string => {
  const baseUrl = window.location.origin
  return `${baseUrl}?join=${householdId}`
}

export function FamilyShareModal({ onClose }: Props) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'share' | 'join'>('share')
  const [joinPin, setJoinPin] = useState('')
  const [householdName, setHouseholdName] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [isSavingName, setIsSavingName] = useState(false)

  const currentHouseholdId = localStorage.getItem('fridgeplan.householdId') || ''
  const pin = householdIdToPin(currentHouseholdId)
  const shareUrl = getShareUrl(currentHouseholdId)

  // Fetch household name on mount
  useState(() => {
    const fetchHouseholdName = async () => {
      try {
        const response = await fetch(`${API}/api/household`, {
          headers: {
            'X-Household-ID': currentHouseholdId
          }
        })
        if (response.ok) {
          const data = await response.json()
          setHouseholdName(data.name || 'My Family')
        }
      } catch (e) {
        console.warn('Failed to fetch household name:', e)
        setHouseholdName('My Family')
      }
    }
    fetchHouseholdName()
  })

  const handleSaveName = async () => {
    if (!householdName.trim()) return

    setIsSavingName(true)
    try {
      await fetch(`${API}/api/household`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Household-ID': currentHouseholdId
        },
        body: JSON.stringify({ name: householdName.trim() })
      })
      setIsEditingName(false)
    } catch (e) {
      console.error('Failed to save household name:', e)
    } finally {
      setIsSavingName(false)
    }
  }

  const handleJoinFamily = () => {
    if (joinPin.length !== 6) {
      alert('Please enter a 6-digit PIN')
      return
    }

    // For now, we'll need to implement a backend endpoint to lookup household by PIN
    // This is a simplified version that just sets the household ID from URL
    alert('PIN joining coming soon! For now, use the QR code or share link.')
  }

  const handleJoinFromUrl = (householdId: string) => {
    localStorage.setItem('fridgeplan.householdId', householdId)
    window.location.reload()
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
      .then(() => alert(`${label} copied to clipboard!`))
      .catch(() => alert('Failed to copy'))
  }

  // Check if joining from URL on mount
  useState(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const joinId = urlParams.get('join')
    if (joinId) {
      handleJoinFromUrl(joinId)
    }
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-orange-500 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">👨‍👩‍👧‍👦 Family Sharing</h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-3xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('share')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                mode === 'share'
                  ? 'bg-white text-amber-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Share My Plan
            </button>
            <button
              onClick={() => setMode('join')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                mode === 'join'
                  ? 'bg-white text-amber-600'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Join Family
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'share' ? (
            <div className="space-y-6">
              {/* Household Name */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                  Family Name
                </label>
                {isEditingName ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={householdName}
                      onChange={(e) => setHouseholdName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                      placeholder="My Family"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={isSavingName}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-4 py-3 bg-stone-50 dark:bg-stone-700 rounded-lg">
                    <span className="font-semibold text-stone-900 dark:text-stone-100">
                      {householdName || 'My Family'}
                    </span>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-stone-600 dark:text-stone-400 text-center">
                  Scan this QR code on another device to sync meal plans
                </p>
                <div className="p-4 bg-white rounded-xl shadow-inner">
                  <QRCodeSVG value={shareUrl} size={200} level="M" />
                </div>
              </div>

              {/* PIN Code */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                  Share PIN (easier for phone entry)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-stone-50 dark:bg-stone-700 rounded-lg font-mono text-2xl font-bold text-center text-amber-600 tracking-widest">
                    {pin}
                  </div>
                  <button
                    onClick={() => copyToClipboard(pin, 'PIN')}
                    className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                  >
                    📋
                  </button>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
                  Your family members can enter this PIN to join
                </p>
              </div>

              {/* Share Link */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                  Share Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-300 dark:border-stone-600 rounded-lg text-xs text-stone-600 dark:text-stone-400 font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(shareUrl, 'Link')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                  >
                    📋
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>ℹ️ How it works:</strong><br />
                  All devices with the same PIN will see the same meal plan. Changes sync in real-time!
                  Perfect for kitchen tablets, phones, and computers.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Join by PIN */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                  Enter Family PIN
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinPin}
                    onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="flex-1 px-4 py-3 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 font-mono text-2xl text-center tracking-widest"
                  />
                  <button
                    onClick={handleJoinFamily}
                    disabled={joinPin.length !== 6}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                  >
                    Join
                  </button>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">
                  Ask your family member for their 6-digit PIN
                </p>
              </div>

              {/* Or Scan QR */}
              <div className="text-center">
                <div className="inline-block px-4 py-2 bg-stone-100 dark:bg-stone-700 rounded-full">
                  <span className="text-sm font-medium text-stone-600 dark:text-stone-400">
                    or scan their QR code
                  </span>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>⚠️ Note:</strong><br />
                  Joining a new family will replace your current meal plan with theirs.
                  Your current plan will no longer be accessible from this device.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 dark:border-stone-700 p-4">
          <button
            onClick={onClose}
            className="w-full py-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-300 font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

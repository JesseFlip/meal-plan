import { useEffect, useState } from 'react'
import { useTranslation } from '../hooks/useTranslation'

export function InstallPrompt() {
  const { t } = useTranslation()
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if already installed or dismissed
    const isDismissed = localStorage.getItem('pwa-install-dismissed')
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches

    if (isDismissed || isInstalled) {
      return
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Show prompt after a short delay
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true')
    setShowPrompt(false)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-2xl p-4 text-white">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
            📱
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base mb-1">
              {t('pwa.installTitle')}
            </h3>
            <p className="text-sm text-white/90 mb-3">
              {t('pwa.installMessage')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 px-4 py-2 bg-white text-amber-600 font-semibold text-sm rounded-lg hover:bg-amber-50 transition-colors"
              >
                {t('pwa.install')}
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium text-sm rounded-lg transition-colors"
              >
                {t('pwa.later')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

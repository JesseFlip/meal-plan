import { useTranslation } from '../hooks/useTranslation'

export function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation()

  return (
    <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm">
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
          language === 'en'
            ? 'bg-stone-900 text-white'
            : 'text-stone-500 hover:text-stone-700'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('es')}
        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
          language === 'es'
            ? 'bg-stone-900 text-white'
            : 'text-stone-500 hover:text-stone-700'
        }`}
        aria-label="Cambiar a Español"
      >
        ES
      </button>
    </div>
  )
}

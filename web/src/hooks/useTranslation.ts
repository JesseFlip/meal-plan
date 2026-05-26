import { useState, useEffect } from 'react'
import translations, { Language, TranslationKey } from '../i18n/translations'

const STORAGE_KEY = 'fridgeplan.language'

/**
 * i18n hook for FridgePlan
 * Reads language preference from localStorage, defaults to 'en'
 */
export function useTranslation() {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null
    if (stored === 'en' || stored === 'es') {
      setLanguageState(stored)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    localStorage.setItem(STORAGE_KEY, lang)
    setLanguageState(lang)
  }

  const t = (key: TranslationKey): string => {
    return translations[language][key]
  }

  return {
    language,
    setLanguage,
    t,
  }
}

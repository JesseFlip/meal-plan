import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const getHouseholdId = (): string | null => {
  return localStorage.getItem('fridgeplan.householdId')
}

const setHouseholdId = (id: string) => {
  localStorage.setItem('fridgeplan.householdId', id)
}

const initializeHousehold = async (): Promise<string> => {
  try {
    const response = await fetch(`${API}/api/household/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'My Household' })
    })
    if (response.ok) {
      const data = await response.json()
      setHouseholdId(data.id)
      return data.id
    }
  } catch (e) {
    console.error('Failed to initialize household:', e)
  }
  throw new Error('Failed to initialize household')
}

const getHeaders = async () => {
  let householdId = getHouseholdId()
  if (!householdId) {
    householdId = await initializeHousehold()
  }
  return {
    'Content-Type': 'application/json',
    'X-Household-ID': householdId
  }
}

export interface HouseholdSettings {
  id: number
  household_id: string
  num_meal_slots: number
  meal_slot_names: string[]
  first_day_of_week: number
  plan_duration_days: number
  dietary_tags: string[]
  language: string
  handwriting_color: string
  night_mode: boolean
}

export function useSettings() {
  const [settings, setSettings] = useState<HouseholdSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSettings = async () => {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${API}/api/household/settings`, { headers })
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (e) {
      console.warn('Failed to load settings:', e)
    } finally {
      setLoading(false)
    }
  }

  const updateHandwritingColor = async (color: string) => {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${API}/api/household/settings`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ handwriting_color: color }),
      })
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (e) {
      console.error('Failed to update handwriting color:', e)
    }
  }

  const updateNightMode = async (enabled: boolean) => {
    try {
      const headers = await getHeaders()
      const response = await fetch(`${API}/api/household/settings`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ night_mode: enabled }),
      })
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (e) {
      console.error('Failed to update night mode:', e)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  return {
    settings,
    loading,
    handwritingColor: settings?.handwriting_color || '#000000',
    nightMode: settings?.night_mode || false,
    updateHandwritingColor,
    updateNightMode,
  }
}

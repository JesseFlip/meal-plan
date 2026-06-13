import { useState, useEffect } from 'react'

export type MealHistoryItem = {
  meal_name: string
  use_count: number
}

const API = import.meta.env.VITE_API_URL || ''

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

export function useMealHistory() {
  const [meals, setMeals] = useState<MealHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadHistory = async () => {
    try {
      const headers = await getHeaders()
      const r = await fetch(`${API}/api/meals/history`, { headers })
      if (r.ok) {
        const data = await r.json()
        setMeals(data)
      }
    } catch (e) {
      console.warn('Failed to fetch meal history:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  return {
    meals,
    loading,
    refresh: loadHistory
  }
}

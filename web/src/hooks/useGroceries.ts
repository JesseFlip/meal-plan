import { useState, useEffect, useCallback } from 'react'

export type GroceryItem = {
  id: number
  household_id: string
  name: string
  category: string
  store: string
  bought: boolean
  is_derived: boolean
  source_meal_id: number | null
}

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

export function useGroceries() {
  const [items, setItems] = useState<GroceryItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadGroceries = useCallback(async () => {
    try {
      const headers = await getHeaders()
      const r = await fetch(`${API}/api/groceries`, { headers })
      if (r.ok) {
        const data = await r.json()
        setItems(data)
      }
    } catch (e) {
      console.warn('Failed to fetch groceries:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGroceries()

    const handler = () => loadGroceries()
    window.addEventListener('fridgeplan.groceriesChanged', handler)
    return () => window.removeEventListener('fridgeplan.groceriesChanged', handler)
  }, [loadGroceries])

  const addGrocery = async (name: string, store: string = 'Other') => {
    try {
      const headers = await getHeaders()
      const resp = await fetch(`${API}/api/groceries`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, store })
      })
      if (resp.ok) {
        // Optimistic update happens via the WS broadcast or we can manually re-fetch
        loadGroceries()
      }
    } catch (e) {
      console.warn('Failed to add grocery:', e)
    }
  }

  const toggleGrocery = async (id: number, bought: boolean) => {
    // Optimistic update
    setItems(prev => prev.map(item => item.id === id ? { ...item, bought } : item))

    try {
      const headers = await getHeaders()
      await fetch(`${API}/api/groceries/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ bought })
      })
    } catch (e) {
      console.warn('Failed to toggle grocery:', e)
      loadGroceries() // rollback
    }
  }

  const clearBought = async () => {
    try {
      const headers = await getHeaders()
      await fetch(`${API}/api/groceries/clear`, {
        method: 'POST',
        headers
      })
      loadGroceries()
    } catch (e) {
      console.warn('Failed to clear groceries:', e)
    }
  }

  const syncGroceries = async () => {
    try {
      const headers = await getHeaders()
      await fetch(`${API}/api/groceries/sync`, {
        method: 'POST',
        headers
      })
      loadGroceries()
    } catch (e) {
      console.warn('Failed to sync groceries:', e)
    }
  }

  return {
    items,
    loading,
    addGrocery,
    toggleGrocery,
    clearBought,
    syncGroceries
  }
}

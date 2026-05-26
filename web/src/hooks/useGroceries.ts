import { useState, useEffect, useCallback } from 'react'

export type GroceryItem = {
  id: number
  household_id: string
  name: string
  category: string
  bought: boolean
  is_derived: boolean
  source_meal_id: number | null
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const getHeaders = () => {
  const householdId = localStorage.getItem('fridgeplan.householdId')
  return {
    'Content-Type': 'application/json',
    'X-Household-ID': householdId || ''
  }
}

export function useGroceries() {
  const [items, setItems] = useState<GroceryItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadGroceries = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/groceries`, { headers: getHeaders() })
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

  const addGrocery = async (name: string) => {
    try {
      const resp = await fetch(`${API}/api/groceries`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name })
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
      await fetch(`${API}/api/groceries/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ bought })
      })
    } catch (e) {
      console.warn('Failed to toggle grocery:', e)
      loadGroceries() // rollback
    }
  }

  const clearBought = async () => {
    try {
      await fetch(`${API}/api/groceries/clear`, {
        method: 'POST',
        headers: getHeaders()
      })
      loadGroceries()
    } catch (e) {
      console.warn('Failed to clear groceries:', e)
    }
  }

  const syncGroceries = async () => {
    try {
      await fetch(`${API}/api/groceries/sync`, {
        method: 'POST',
        headers: getHeaders()
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

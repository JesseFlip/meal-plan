import { useState, useEffect, useCallback } from 'react'

export type FoodOption = {
  id: number
  name: string
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

export function useFoodOptions() {
  const [proteins, setProteins] = useState<FoodOption[]>([])
  const [veggies, setVeggies] = useState<FoodOption[]>([])
  const [carbs, setCarbs] = useState<FoodOption[]>([])
  const [fats, setFats] = useState<FoodOption[]>([])
  const [loading, setLoading] = useState(true)

  const loadAllOptions = useCallback(async () => {
    try {
      const headers = await getHeaders()

      const [proteinsResp, veggiesResp, carbsResp, fatsResp] = await Promise.all([
        fetch(`${API}/api/proteins`, { headers }),
        fetch(`${API}/api/veggies`, { headers }),
        fetch(`${API}/api/carbs`, { headers }),
        fetch(`${API}/api/fats`, { headers })
      ])

      if (proteinsResp.ok) setProteins(await proteinsResp.json())
      if (veggiesResp.ok) setVeggies(await veggiesResp.json())
      if (carbsResp.ok) setCarbs(await carbsResp.json())
      if (fatsResp.ok) setFats(await fatsResp.json())
    } catch (e) {
      console.warn('Failed to fetch food options:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAllOptions()
  }, [loadAllOptions])

  const addProtein = async (name: string) => {
    try {
      const headers = await getHeaders()
      const resp = await fetch(`${API}/api/proteins`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name })
      })
      if (resp.ok) {
        loadAllOptions()
      }
    } catch (e) {
      console.warn('Failed to add protein:', e)
    }
  }

  const addVeggie = async (name: string) => {
    try {
      const headers = await getHeaders()
      const resp = await fetch(`${API}/api/veggies`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name })
      })
      if (resp.ok) {
        loadAllOptions()
      }
    } catch (e) {
      console.warn('Failed to add veggie:', e)
    }
  }

  const addCarb = async (name: string) => {
    try {
      const headers = await getHeaders()
      const resp = await fetch(`${API}/api/carbs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name })
      })
      if (resp.ok) {
        loadAllOptions()
      }
    } catch (e) {
      console.warn('Failed to add carb:', e)
    }
  }

  const addFat = async (name: string) => {
    try {
      const headers = await getHeaders()
      const resp = await fetch(`${API}/api/fats`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name })
      })
      if (resp.ok) {
        loadAllOptions()
      }
    } catch (e) {
      console.warn('Failed to add fat:', e)
    }
  }

  const deleteProtein = async (id: number) => {
    try {
      const headers = await getHeaders()
      await fetch(`${API}/api/proteins/${id}`, {
        method: 'DELETE',
        headers
      })
      loadAllOptions()
    } catch (e) {
      console.warn('Failed to delete protein:', e)
    }
  }

  const deleteVeggie = async (id: number) => {
    try {
      const headers = await getHeaders()
      await fetch(`${API}/api/veggies/${id}`, {
        method: 'DELETE',
        headers
      })
      loadAllOptions()
    } catch (e) {
      console.warn('Failed to delete veggie:', e)
    }
  }

  const deleteCarb = async (id: number) => {
    try {
      const headers = await getHeaders()
      await fetch(`${API}/api/carbs/${id}`, {
        method: 'DELETE',
        headers
      })
      loadAllOptions()
    } catch (e) {
      console.warn('Failed to delete carb:', e)
    }
  }

  const deleteFat = async (id: number) => {
    try {
      const headers = await getHeaders()
      await fetch(`${API}/api/fats/${id}`, {
        method: 'DELETE',
        headers
      })
      loadAllOptions()
    } catch (e) {
      console.warn('Failed to delete fat:', e)
    }
  }

  return {
    proteins,
    veggies,
    carbs,
    fats,
    loading,
    addProtein,
    addVeggie,
    addCarb,
    addFat,
    deleteProtein,
    deleteVeggie,
    deleteCarb,
    deleteFat
  }
}

import { useState, useEffect, useCallback } from 'react'

export type FoodOption = {
  id: number
  name: string
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

  const clearAll = async () => {
    try {
      const headers = await getHeaders()

      // Delete all items in parallel
      const deletePromises = [
        ...proteins.map(p => fetch(`${API}/api/proteins/${p.id}`, { method: 'DELETE', headers })),
        ...veggies.map(v => fetch(`${API}/api/veggies/${v.id}`, { method: 'DELETE', headers })),
        ...carbs.map(c => fetch(`${API}/api/carbs/${c.id}`, { method: 'DELETE', headers })),
        ...fats.map(f => fetch(`${API}/api/fats/${f.id}`, { method: 'DELETE', headers }))
      ]

      await Promise.all(deletePromises)
      loadAllOptions()
    } catch (e) {
      console.warn('Failed to clear all ingredients:', e)
    }
  }

  const loadTemplate = async (template: {
    proteins: string[]
    veggies: string[]
    carbs: string[]
    fats: string[]
  }) => {
    try {
      const headers = await getHeaders()

      // Get existing items to avoid duplicates
      const existingProteins = new Set(proteins.map(p => p.name.toLowerCase()))
      const existingVeggies = new Set(veggies.map(v => v.name.toLowerCase()))
      const existingCarbs = new Set(carbs.map(c => c.name.toLowerCase()))
      const existingFats = new Set(fats.map(f => f.name.toLowerCase()))

      // Only add items that don't already exist
      const addPromises = [
        ...template.proteins
          .filter(name => !existingProteins.has(name.toLowerCase()))
          .map(name => fetch(`${API}/api/proteins`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name })
          })),
        ...template.veggies
          .filter(name => !existingVeggies.has(name.toLowerCase()))
          .map(name => fetch(`${API}/api/veggies`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name })
          })),
        ...template.carbs
          .filter(name => !existingCarbs.has(name.toLowerCase()))
          .map(name => fetch(`${API}/api/carbs`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name })
          })),
        ...template.fats
          .filter(name => !existingFats.has(name.toLowerCase()))
          .map(name => fetch(`${API}/api/fats`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ name })
          }))
      ]

      await Promise.all(addPromises)
      loadAllOptions()
    } catch (e) {
      console.warn('Failed to load template:', e)
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
    deleteFat,
    clearAll,
    loadTemplate
  }
}

import { useState, useEffect } from 'react'

export type DayCompliance = {
  day: number
  compliant: boolean
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

export function useCompliance() {
  const [compliance, setCompliance] = useState<DayCompliance[]>([])
  const [loading, setLoading] = useState(true)

  const loadCompliance = async () => {
    try {
      const headers = await getHeaders()
      const r = await fetch(`${API}/api/compliance`, { headers })
      if (r.ok) {
        const data = await r.json()
        setCompliance(data)
      }
    } catch (e) {
      console.warn('Failed to fetch compliance:', e)
    } finally {
      setLoading(false)
    }
  }

  const toggleDay = async (day: number) => {
    // Optimistic update
    setCompliance(prev =>
      prev.map(c => c.day === day ? { ...c, compliant: !c.compliant } : c)
    )

    try {
      const headers = await getHeaders()
      const current = compliance.find(c => c.day === day)
      const newCompliant = !current?.compliant

      await fetch(`${API}/api/compliance/${day}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ compliant: newCompliant })
      })
    } catch (e) {
      console.warn('Failed to toggle compliance:', e)
      loadCompliance() // rollback
    }
  }

  useEffect(() => {
    loadCompliance()
  }, [])

  return {
    compliance,
    loading,
    toggleDay,
    refresh: loadCompliance
  }
}

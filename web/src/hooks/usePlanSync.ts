import { useEffect, useRef, useState } from 'react'

export type Slot = {
  id: number
  day: number
  slot: number
  text: string
  person: string | null
  state: 'planned' | 'fasting' | 'skipped' | 'eaten'
  updated_at: string
}

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'

export function usePlanSync() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => {
    cancelledRef.current = false

    const loadPlan = async () => {
      try {
        const r = await fetch(`${API}/api/plan`)
        if (r.ok) {
          const data = await r.json()
          if (!cancelledRef.current) setSlots(data)
        }
      } catch (e) {
        console.warn('Failed to fetch plan:', e)
      }
    }
    loadPlan()

    const connect = () => {
      if (cancelledRef.current) return
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => setConnected(true)
      ws.onclose = () => {
        setConnected(false)
        if (!cancelledRef.current) setTimeout(connect, 2000)
      }
      ws.onerror = () => {
        try { ws.close() } catch {}
      }
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          if (msg.type === 'slot.updated') {
            setSlots(prev => prev.map(s => s.id === msg.data.id ? msg.data : s))
          } else if (msg.type === 'plan.reset') {
            loadPlan()
          }
        } catch {}
      }
    }
    connect()

    return () => {
      cancelledRef.current = true
      wsRef.current?.close()
    }
  }, [])

  const updateSlot = async (id: number, patch: Partial<Slot>) => {
    // Optimistic update
    setSlots(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
    try {
      const resp = await fetch(`${API}/api/plan/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      })
      if (resp.ok) {
        const data = await resp.json()
        setSlots(prev => prev.map(s => s.id === id ? data : s))
      }
    } catch (e) {
      console.warn('Update failed:', e)
    }
  }

  return { slots, connected, updateSlot }
}

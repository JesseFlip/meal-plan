import { useEffect, useRef, useState } from 'react'

export type Slot = {
  id: number
  week_start_date: string  // ISO date string (YYYY-MM-DD) for Monday of the week
  day: number
  slot: number
  text: string
  protein: string
  veggie: string
  carb_or_fat: string
  person: string | null
  state: 'planned' | 'fasting' | 'skipped' | 'eaten'
  rating: '' | 'good' | 'bad'
  meal_type: 'regular' | 'smoothie' | 'cheat'
  updated_at: string
}

const API = import.meta.env.VITE_API_URL || ''

// Derive WebSocket URL from API URL if not explicitly set
const getWebSocketUrl = (): string => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL
  }

  // If API URL is set, derive WS URL from it
  if (API) {
    const url = new URL(API)
    // Convert http(s) to ws(s)
    const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${wsProtocol}//${url.host}/ws`
  }

  // Fallback to relative WebSocket URL (same domain)
  return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`
}

const WS_URL = getWebSocketUrl()

// Household ID management
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

export function usePlanSync(selectedWeek?: string) {
  const [slots, setSlots] = useState<Slot[]>([])
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const cancelledRef = useRef(false)
  const selectedWeekRef = useRef(selectedWeek)

  // ── Sync mode ──────────────────────────────────────────────────────────────
  // SSR-safe: initialise with 'auto'; read localStorage after mount.
  const [syncMode, setSyncModeState] = useState<'auto' | 'manual'>('auto')
  const syncModeRef = useRef<'auto' | 'manual'>('auto')

  useEffect(() => {
    const stored = localStorage.getItem('fridgeplan.syncMode') as 'auto' | 'manual' | null
    if (stored === 'manual') {
      setSyncModeState('manual')
      syncModeRef.current = 'manual'
    }
  }, [])

  // Keep ref in sync so WS handler (created once) always reads current mode.
  useEffect(() => {
    syncModeRef.current = syncMode
  }, [syncMode])

  // Keep selectedWeekRef in sync
  useEffect(() => {
    selectedWeekRef.current = selectedWeek
  }, [selectedWeek])

  const setSyncMode = (mode: 'auto' | 'manual') => {
    localStorage.setItem('fridgeplan.syncMode', mode)
    setSyncModeState(mode)
    // syncModeRef is updated by the effect above on next render; for immediate
    // usage within the same tick we also set it here.
    syncModeRef.current = mode
  }

  // ── Queues ─────────────────────────────────────────────────────────────────
  // pendingLocal: outbound edits made while in Manual mode, not yet pushed.
  const pendingLocalRef = useRef<Array<{ id: number; patch: Partial<Slot> }>>([])
  // pendingRemote: incoming WS slot updates received while in Manual mode.
  const pendingRemoteRef = useRef<Slot[]>([])

  // pendingCount = local edits only (changes the *user* made, not yet pushed).
  // Remote queued items do not count — they are not the user's changes.
  const [pendingCount, setPendingCount] = useState(0)
  // pendingSlotIds: state (not ref-derived) so MealCell re-renders on change.
  const [pendingSlotIds, setPendingSlotIds] = useState<Set<number>>(new Set())

  /**
   * Recompute pending state from current refs.
   * Safe to call with empty queues — produces (0, empty Set) correctly.
   * Must be called after any mutation of pendingLocalRef.
   */
  const refreshPending = () => {
    const ids = new Set(pendingLocalRef.current.map(p => p.id))
    setPendingCount(pendingLocalRef.current.length)
    setPendingSlotIds(ids)
  }

  // ── Data fetching ──────────────────────────────────────────────────────────
  const loadPlan = async () => {
    try {
      const headers = await getHeaders()
      const url = selectedWeekRef.current
        ? `${API}/api/plan?week=${selectedWeekRef.current}`
        : `${API}/api/plan`
      const r = await fetch(url, { headers })
      if (r.ok) {
        const data = await r.json()
        if (!cancelledRef.current) setSlots(data)
      }
    } catch (e) {
      console.warn('Failed to fetch plan:', e)
    }
  }

  // ── Reconnect reconciliation (Manual mode only) ────────────────────────────
  /**
   * After a WS reconnect in Manual mode, fetch server state and diff against
   * current display. Adds genuinely-newer server slots to pendingRemote so the
   * user sees "N changes pending" without their display being overwritten.
   *
   * Comparison key: slot.id (stable integer PK).
   * Timestamp: slot.updated_at (ISO string — lexicographic compare is correct
   *            for ISO 8601 timestamps).
   * Conflict rule: if a slot is already in pendingLocal, suppress the server
   *                version from pendingRemote (local edit wins at flush time).
   */
  const reconcileAfterReconnect = async () => {
    try {
      const headers = await getHeaders()
      const r = await fetch(`${API}/api/plan`, { headers })
      if (!r.ok) return
      const serverSlots: Slot[] = await r.json()

      const localPendingIds = new Set(pendingLocalRef.current.map(p => p.id))

      setSlots(currentDisplay => {
        const displayMap = new Map(currentDisplay.map(s => [s.id, s]))
        const newRemote: Slot[] = [...pendingRemoteRef.current]

        for (const serverSlot of serverSlots) {
          // Skip slots the user has already edited locally — local edit wins.
          if (localPendingIds.has(serverSlot.id)) continue

          const displayed = displayMap.get(serverSlot.id)
          if (!displayed) continue

          // Add to pendingRemote only if server is genuinely newer.
          if (serverSlot.updated_at > displayed.updated_at) {
            // Replace any prior pendingRemote entry for this slot.
            const idx = newRemote.findIndex(s => s.id === serverSlot.id)
            if (idx >= 0) newRemote[idx] = serverSlot
            else newRemote.push(serverSlot)
          }
        }

        pendingRemoteRef.current = newRemote
        refreshPending()
        return currentDisplay // display unchanged; only pendingRemote updated
      })
    } catch (e) {
      console.warn('Reconcile after reconnect failed:', e)
    }
  }

  // ── Reload when week changes ───────────────────────────────────────────────
  useEffect(() => {
    loadPlan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWeek])

  // ── WebSocket ──────────────────────────────────────────────────────────────
  useEffect(() => {
    cancelledRef.current = false

    const connect = () => {
      if (cancelledRef.current) return
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        if (syncModeRef.current === 'manual') {
          reconcileAfterReconnect()
        }
      }

      ws.onclose = () => {
        setConnected(false)
        if (!cancelledRef.current) setTimeout(connect, 2000)
      }

      ws.onerror = () => {
        try { ws.close() } catch { /* swallow */ }
      }

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          if (msg.type === 'slot.updated') {
            // Only apply updates for the currently selected week
            if (msg.data.week_start_date === selectedWeekRef.current) {
              if (syncModeRef.current === 'auto') {
                // Auto: apply immediately (existing behaviour).
                setSlots(prev => prev.map(s => s.id === msg.data.id ? msg.data : s))
              } else {
                // Manual: queue; do not apply to display.
                pendingRemoteRef.current = [
                  ...pendingRemoteRef.current.filter(s => s.id !== msg.data.id),
                  msg.data
                ]
                refreshPending()
              }
            }
          } else if (msg.type === 'plan.reset') {
            loadPlan()
          }
        } catch { /* swallow parse errors */ }
      }
    }

    connect()

    return () => {
      cancelledRef.current = true
      wsRef.current?.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── updateSlot ─────────────────────────────────────────────────────────────
  const updateSlot = async (id: number, patch: Partial<Slot>) => {
    // Optimistic update to display in both modes.
    setSlots(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))

    if (syncModeRef.current === 'auto') {
      // Auto: push immediately (existing behaviour).
      try {
        const headers = await getHeaders()
        const resp = await fetch(`${API}/api/plan/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(patch)
        })
        if (resp.ok) {
          const data = await resp.json()
          setSlots(prev => prev.map(s => s.id === id ? data : s))
        }
      } catch (e) {
        console.warn('Update failed:', e)
      }
    } else {
      // Manual: queue; coalesce — replace any prior pending edit for same slot.
      pendingLocalRef.current = [
        ...pendingLocalRef.current.filter(p => p.id !== id),
        { id, patch }
      ]
      refreshPending()
    }
  }

  // ── flush ──────────────────────────────────────────────────────────────────
  const flush = async () => {
    const localEdits = [...pendingLocalRef.current]
    const remoteUpdates = [...pendingRemoteRef.current]

    // Clear queues and reset both pending state values atomically.
    pendingLocalRef.current = []
    pendingRemoteRef.current = []
    refreshPending() // resets pendingCount → 0 and pendingSlotIds → empty Set

    // Push local edits to server in queue order.
    const headers = await getHeaders()
    for (const { id, patch } of localEdits) {
      try {
        const resp = await fetch(`${API}/api/plan/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(patch)
        })
        if (resp.ok) {
          const data = await resp.json()
          setSlots(prev => prev.map(s => s.id === id ? data : s))
        }
      } catch (e) {
        console.warn(`Flush failed for slot ${id}:`, e)
      }
    }

    // Apply remote updates — skip slots that were also in localEdits (local wins).
    const localIds = new Set(localEdits.map(e => e.id))
    setSlots(prev => prev.map(s => {
      const remote = remoteUpdates.find(r => r.id === s.id && !localIds.has(s.id))
      return remote ?? s
    }))
  }

  return {
    slots,
    connected,
    updateSlot,
    syncMode,
    setSyncMode,
    pendingCount,
    pendingSlotIds,
    flush
  }
}

# Plan 001 — Sync-mode toggle

**Spec**: specs/001-sync-mode-toggle/spec.md  
**Branch**: feat/001-sync-mode-toggle  
**Date**: 2026-05-10  
**Complexity**: S (one evening)

---

## Overview

Four files change: `usePlanSync.ts`, `SyncStatus.tsx`, `App.tsx`, `MealCell.tsx`. No new files. No new dependencies. No config changes. Implementation order follows data-flow: hook (logic) → component (display) → wiring (App) → cell tint (MealCell).

All queue logic stays inside `usePlanSync` as `useRef` arrays. No extraction to service modules or separate stores.

---

## Implementation Notes (from spec approval)

**Note 1 — Amber tint fallback**: If `bg-amber-50 border-amber-200` visually conflicts with the red Caveat handwriting on cream background during implementation, fall back to a small amber dot in the upper-right corner of the cell. Decision made at implementation time; spec answer stands.

**Note 2 — Reconnect diff strategy**: Spelled out explicitly below in Step 1d.

**Note 3 — Default is intentionally NOT device-aware**: The default `'auto'` is a fixed global default, not detected from viewport, user-agent, or device type. This is a conscious decision deferred to Feature 007 (Settings panel), where the user will be able to set their preferred mode explicitly per device. Do not add device-detection logic in this feature.

---

## Step 1 — `usePlanSync.ts`

### 1a. State and storage

**localStorage SSR safety**: Do not read `localStorage` in the `useState` initializer — if this PWA is ever prerendered by Netlify or vite-plugin-pwa, `localStorage` is undefined at build time and throws. Read it inside a `useEffect` after mount instead, with `'auto'` as the SSR-safe initial value:

```ts
const [syncMode, setSyncModeState] = useState<'auto' | 'manual'>('auto') // SSR-safe default

useEffect(() => {
  const stored = localStorage.getItem('fridgeplan.syncMode') as 'auto' | 'manual' | null
  if (stored === 'manual') setSyncModeState('manual')
}, []) // runs once after mount; deps: empty

const setSyncMode = (mode: 'auto' | 'manual') => {
  localStorage.setItem('fridgeplan.syncMode', mode)
  setSyncModeState(mode)
}
```

The one-tick delay between mount and localStorage read means the app renders with `'auto'` momentarily before applying the stored preference. This is acceptable — the alternative (reading in the initializer) breaks SSR and is a future footgun.

**Cross-tab storage sync**: Explicitly deferred. If the user has two tabs open on the same laptop, changing sync mode in one tab will not reflect in the other. A `window.addEventListener('storage', ...)` listener could sync this, but the primary use cases are: fridge tablet (kiosk, one tab) and phone (one tab). Cross-tab sync adds complexity for a rare scenario. Decision: **no storage event listener in this feature**. Revisit if it becomes a reported problem.

All subsequent writes go through `setSyncMode` which persists atomically.

### 1b. Queue refs and pendingCount semantics

```ts
const pendingLocalRef = useRef<Array<{ id: number; patch: Partial<Slot> }>>([]) 
const pendingRemoteRef = useRef<Slot[]>([])
const [pendingCount, setPendingCount] = useState(0)
const [pendingSlotIds, setPendingSlotIds] = useState<Set<number>>(new Set())
```

- `pendingLocalRef`: outbound edits queued while in Manual mode. Each entry is `{id, patch}`.
- `pendingRemoteRef`: incoming server-side slot states queued while in Manual mode.
- `pendingCount`: **local edits only** — `pendingLocalRef.current.length`. Remote queued items are not counted. The pill label "N changes pending" refers to changes *the user made* that haven't been pushed yet. Incoming changes from the server are not the user's changes and should not inflate this number.
- `pendingSlotIds`: a **state** (not a derived value from a ref) tracking which slot IDs have pending local edits. This must be state — not computed from a ref — because ref mutations do not trigger re-renders. Without this as state, the amber tint on cells would never update.

Update helper — called after any mutation of either ref:

```ts
const refreshPending = () => {
  const ids = new Set(pendingLocalRef.current.map(p => p.id))
  setPendingCount(pendingLocalRef.current.length)  // local only
  setPendingSlotIds(ids)
}
```

Called after any mutation of `pendingLocalRef`. Remote queue mutations do not call `refreshPending` — they only bump a separate internal counter if we ever need to show remote-count separately (not in this spec).

### 1c. WebSocket message handler (mode-aware)

Replace the existing `ws.onmessage` handler:

```ts
ws.onmessage = (e) => {
  try {
    const msg = JSON.parse(e.data)
    if (msg.type === 'slot.updated') {
      if (syncModeRef.current === 'auto') {
        // Auto: apply immediately (existing behavior)
        setSlots(prev => prev.map(s => s.id === msg.data.id ? msg.data : s))
      } else {
        // Manual: queue, do not apply to display
        pendingRemoteRef.current = [
          ...pendingRemoteRef.current.filter(s => s.id !== msg.data.id),
          msg.data
        ]
        refreshPending()
      }
    } else if (msg.type === 'plan.reset') {
      loadPlan()
    }
  } catch {}
}
```

Note: `syncModeRef` is a ref that mirrors `syncMode` state so that the closure inside `ws.onmessage` always reads the current value without stale closure issues:

```ts
const syncModeRef = useRef(syncMode)
useEffect(() => { syncModeRef.current = syncMode }, [syncMode])
```

### 1d. WebSocket reconnect in Manual mode — diff strategy

When the WebSocket reconnects (`ws.onopen` fires after a drop), if the current mode is Manual:

```ts
ws.onopen = () => {
  setConnected(true)
  if (syncModeRef.current === 'manual') {
    reconcileAfterReconnect()
  }
}
```

`reconcileAfterReconnect()` does the following:

1. **Fetch**: call `GET /api/plan` to get current server state as `serverSlots: Slot[]`.
2. **Comparison key**: slot `id` (integer primary key). This is the stable identity for all diffing.
3. **Timestamp handling**: for each server slot, compare `serverSlot.updated_at` against the corresponding displayed slot's `updated_at`.
   - If `serverSlot.updated_at > displayedSlot.updated_at`: the server is newer. Add the server slot to `pendingRemote`, replacing any prior entry for that `id`.
   - If `serverSlot.updated_at <= displayedSlot.updated_at`: the displayed value is at least as recent. Skip — do not add to `pendingRemote`.
4. **Conflict with pendingLocal**: if a slot appears in both `pendingLocal` (a locally queued edit) and the server diff (server is also newer):
   - Do **not** add the server version to `pendingRemote` for that slot. The local edit will win unconditionally when flushed (as specified in Q3). Adding the server version to `pendingRemote` would cause the flush to apply it after the local PUT, overwriting the local edit. Suppress it.
5. **Update count**: call `refreshPending()` after diffing. Note: `refreshPending()` is safe to call with empty queues — it always recomputes from the current ref state, so calling it when `pendingLocalRef.current` is empty correctly sets `pendingCount` to 0 and `pendingSlotIds` to an empty Set. No guard needed.

The result: after reconnect, the user sees `N changes pending` where N reflects only genuine server-side changes they haven't seen, minus any slots they've already edited locally.

### 1e. `updateSlot` (mode-aware)

Modify `updateSlot` to branch on mode:

```ts
const updateSlot = async (id: number, patch: Partial<Slot>) => {
  // Optimistic update to display in both modes
  setSlots(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))

  if (syncModeRef.current === 'auto') {
    // Auto: push immediately (existing behavior)
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
  } else {
    // Manual: queue; replace any prior pending edit for same slot
    pendingLocalRef.current = [
      ...pendingLocalRef.current.filter(p => p.id !== id),
      { id, patch }
    ]
    refreshPending()
  }
}
```

Replacing prior entries for the same slot means only the latest edit is sent on flush (coalescing). If the user edits slot 3 three times before syncing, only the third edit is sent. This is correct for text fields.

### 1f. `flush()`

```ts
const flush = async () => {
  const localEdits = [...pendingLocalRef.current]
  const remoteUpdates = [...pendingRemoteRef.current]

  // Clear queues and reset both pending state values atomically
  pendingLocalRef.current = []
  pendingRemoteRef.current = []
  refreshPending() // resets pendingCount → 0 and pendingSlotIds → empty Set

  // Send local edits to server (in queue order)
  for (const { id, patch } of localEdits) {
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
      console.warn(`Flush failed for slot ${id}:`, e)
    }
  }

  // Apply remote updates — skip any slot that was also in localEdits (local wins)
  const localIds = new Set(localEdits.map(e => e.id))
  setSlots(prev => prev.map(s => {
    const remote = remoteUpdates.find(r => r.id === s.id && !localIds.has(s.id))
    return remote ?? s
  }))
}
```

Queues are cleared before sending to prevent double-accumulation if new edits arrive during the async flush loop.

### 1g. Return shape

```ts
return { slots, connected, updateSlot, syncMode, setSyncMode, pendingCount, pendingSlotIds, flush }
```

Note: `pendingSlotIds` is returned as state (a `Set<number>`) so that `MealCell` can reactively apply the amber tint without prop-drilling `syncMode`.

---

## Step 2 — `SyncStatus.tsx`

Rewrite the component. New props:

```ts
type Props = {
  connected: boolean
  syncMode: 'auto' | 'manual'
  pendingCount: number
  onToggle: () => void   // App decides the toggle/flush logic; component just calls this
}
```

The toggle/flush dispatch logic lives in `App.tsx` (Step 3), not here. `SyncStatus` is a pure display component.

### Pill states

**Auto:**
```tsx
<button onClick={onToggle} aria-label="Sync mode: Live. Tap to switch to Manual.">
  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
  <span>Live</span>
</button>
```
Classes: `bg-white border border-stone-200 text-stone-600`

**Manual, empty:**
```tsx
<button onClick={onToggle} aria-label="Sync mode: Manual. Tap to go Live.">
  <PauseIcon aria-hidden />
  <span>Manual</span>
</button>
```
Classes: `bg-amber-50 border border-amber-300 text-amber-700`

**Manual, N pending:**
```tsx
<button onClick={onToggle} aria-label={`${pendingCount} changes pending. Tap to sync.`}>
  <PauseIcon aria-hidden />
  <span>{pendingCount} changes pending</span>
</button>
```
Classes: `bg-amber-100 border border-amber-400 text-amber-800`

All three states: `min-h-11` (44px), `px-3`, `rounded-full`, `flex items-center gap-2 text-xs sm:text-sm font-medium`.

**Icon**: Use a Unicode pause character `⏸` rendered as a `<span aria-hidden>` rather than an SVG icon import. Rationale: no new icon library dependency; the character is widely supported and renders at small sizes.

---

## Step 3 — `App.tsx`

Destructure new hook values:

```ts
const { slots, connected, updateSlot, syncMode, setSyncMode, pendingCount, pendingSlotIds, flush } = usePlanSync()
```

Add the toggle handler:

```ts
const handleSyncToggle = () => {
  if (syncMode === 'auto') {
    setSyncMode('manual')
  } else if (pendingCount > 0) {
    flush().then(() => setSyncMode('auto'))
  } else {
    setSyncMode('auto')
  }
}
```

Pass to `SyncStatus`:

```tsx
<SyncStatus
  connected={connected}
  syncMode={syncMode}
  pendingCount={pendingCount}
  onToggle={handleSyncToggle}
/>
```

Pass `pendingSlotIds` (state, not a ref-derived value — see Step 1b) to `PlanGrid`, which passes each slot's membership down to `MealCell` as an `isPending` boolean prop. `PlanGrid` does not receive `syncMode` — it only needs the resolved set of pending IDs.

---

## Step 4 — `MealCell.tsx` (minor)

Add `isPending: boolean` prop. When true, apply amber tint or fallback dot indicator:

```tsx
// Primary: amber background tint
className={`... ${isPending ? 'bg-amber-50 border-amber-200' : ''}`}
```

If during implementation the amber tint visually conflicts with Caveat red text on cream, switch to a small dot:

```tsx
{isPending && (
  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden />
)}
```

The cell must have `position: relative` for the dot variant. Decide at implementation time.

---

## Commit plan

| # | Commit message | Files |
|---|---|---|
| 1 | `feat(sync): add syncMode localStorage persistence and queue refs to usePlanSync` | `usePlanSync.ts` |
| 2 | `feat(sync): mode-aware WS handler, updateSlot branching, and flush()` | `usePlanSync.ts` |
| 3 | `feat(sync): reconnect-diff reconciliation in Manual mode` | `usePlanSync.ts` |
| 4 | `feat(sync): rewrite SyncStatus with mode-aware pill` | `SyncStatus.tsx` |
| 5 | `feat(sync): wire sync toggle and pendingSlotIds in App` | `App.tsx` |
| 6 | `feat(sync): add isPending amber tint to MealCell` | `MealCell.tsx` |

Six commits. Each is a single logical unit and independently buildable (TypeScript types will be incomplete between 1 and 2 — that's acceptable as intermediate work on the same branch).

---

## Testing

Manual test cases (no test files in scope — test framework not yet set up per AGENTS.md):

| # | Action | Expected |
|---|---|---|
| T1 | Load app (first visit) | Pill shows `● Live`. localStorage has no `fridgeplan.syncMode` key yet. |
| T2 | Edit a cell in Auto | API `PUT` fires immediately. No amber tint. Other open tab updates within 1s. |
| T3 | Tap pill (Auto) | Switches to `⏸ Manual`. Pill color changes to amber. |
| T4 | Edit a cell in Manual | Cell shows amber tint. No `PUT` in DevTools Network tab. `pendingCount` = 1. |
| T5 | Edit same cell again in Manual | `pendingCount` stays 1 (coalescing). Only one pending entry in queue. |
| T6 | Open second tab (Auto). Edit slot 3 in Tab 2 | Tab 1 (Manual) pill shows `⏸ 1 changes pending`. Grid cell does not update. |
| T7 | Tap pill in Manual (1 local + 1 remote pending) | `pendingCount` shown = 1 (local only). Flush fires: PUT for local edit, remote update applied. Pill switches to `● Live`. |
| T8 | Reload page while in Manual | Mode resets to `'auto'`. Server state displayed. pendingCount = 0. |
| T9 | Set Manual, reload. Confirm mode restores | Mode reads `'manual'` from localStorage on next load. |
| T10 | Kill network while in Manual. Edit a cell. Restore network | Reconnect fires reconciliation. Server delta batched into `pendingRemote`. Pill shows updated count. Tap sync → edit pushes. |
| T11 | Inspect pill in DevTools | Height ≥ 44px at all three states. |
| T12 | Verify `aria-label` on pill | Screen reader reads correct label for each state. |

---

## Risk and rollback

**Risk 1 — Auto mode regression**: The primary risk is that queue logic in Manual mode introduces a bug that affects Auto mode. Mitigation: `syncModeRef.current === 'auto'` is checked at every branch point. The Auto code path is unchanged from Phase 0 — it is not wrapped or re-implemented, only guarded. T1 and T2 verify the Auto path explicitly.

**Risk 2 — Stale closure in WS handler**: The `ws.onmessage` handler is created once inside `useEffect`. If it closes over `syncMode` state directly, it will always see the initial value (`'auto'`). Mitigation: `syncModeRef` is kept in sync with state via a dedicated `useEffect` (`syncModeRef.current = syncMode`). The handler reads `syncModeRef.current`, not the closed-over state variable.

**Risk 3 — `pendingSlotIds` stale on flush**: After flush clears `pendingLocalRef`, `setPendingSlotIds(new Set())` must be called explicitly in `refreshPending()`. If omitted, cells remain amber after sync. Mitigation: `refreshPending()` always recomputes from the ref — it does not assume the previous state.

**Rollback**: If this PR introduces a regression in Auto mode, revert the PR. No database migrations, no config changes, no infra changes. Revert is a one-command operation on a squash commit.

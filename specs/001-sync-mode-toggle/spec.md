# Spec 001 — Sync-mode toggle

**Status**: draft  
**Branch**: feat/001-sync-mode-toggle  
**Author**: Jesse Flippen (via Antigravity)  
**Date**: 2026-05-10  

---

## Problem

The Phase 0 spike applies all incoming WebSocket messages immediately to all clients. This is correct for the fridge tablet (always-on, always current), but wrong for phone-based editing. When Dorys edits from her phone at the grocery store, she doesn't want Jesse's mid-session edits to interrupt her view — and vice versa. There is currently no way to control this behavior per-device.

## Goal

Add a per-device sync mode toggle with two states: **Auto** and **Manual**.

- **Auto** (default on fridge tablet): incoming WebSocket updates apply immediately. Outbound edits push to the server immediately.
- **Manual** (default on mobile): incoming WebSocket updates are queued and do not alter the displayed plan until the user taps a "Sync" button. Outbound edits also queue locally and push only when the user taps "Sync."

The mode is stored per-device in `localStorage`. No server-side state required. No auth required.

---

## Scope

### In scope
- A `syncMode` value (`'auto' | 'manual'`) persisted in `localStorage` under the key `fridgeplan.syncMode`
- Default value: `'auto'`
- Modified `usePlanSync` hook that:
  - In **auto** mode: behaves exactly as today (apply incoming WS messages immediately, push outbound immediately)
  - In **manual** mode: queues incoming WS messages in a ref; queues outbound edits in a ref; applies/pushes both only on explicit `flush()` call
- Updated `SyncStatus` component that:
  - In **auto** mode: shows `● Live` (green pill, pulse animation) — unchanged
  - In **manual** mode: shows `⏸ N changes pending` (amber pill) when queue is non-empty, or `⏸ Manual` when queue is empty
  - The pill is tappable: in **auto** mode, tapping switches to Manual; in **manual** mode with a non-empty queue, tapping flushes then switches to Auto; in **manual** mode with an empty queue, tapping switches to Auto
- A toggle control accessible from the pill itself — this avoids needing a separate settings panel for this feature (settings panel is Feature 007)

### Out of scope
- No per-user settings on the server
- No auth or identity
- No settings route (Feature 007)
- No IndexedDB (localStorage is sufficient for a string flag; IndexedDB is only needed for queued edit payloads if the page reloads mid-edit — that edge case is explicitly deferred)
- No grocery list, week navigation, or any other Feature 002+ behavior

---

## Behavior specification

### Auto mode

1. Incoming WS `slot.updated` → applied immediately to local state (existing behavior)
2. Outbound `updateSlot(id, patch)` → optimistic update + immediate `PUT /api/plan/:id` (existing behavior)
3. Status pill: `● Live` — green, pulsing dot, tap to switch to Manual

### Manual mode

1. Incoming WS `slot.updated` → added to `pendingRemote` queue (a `Slot[]` held in a ref). **Not applied to display.**
2. Outbound `updateSlot(id, patch)` → optimistic update applied to local display state (instant), but `PUT /api/plan/:id` is **not** called. The patch is added to `pendingLocal` queue (`Array<{id, patch}>`).
3. Status pill: `⏸ N changes pending` when N > 0, or `⏸ Manual` when N = 0. Amber color. Tapping the pill calls `flush()`.
4. `flush()`:
   - Sends all `pendingLocal` edits to the server (`PUT /api/plan/:id` for each, in order)
   - Applies all `pendingRemote` updates to local state
   - Clears both queues
   - If a `pendingLocal` edit conflicts with a `pendingRemote` update on the same slot: **local edit wins** (last-write-wins, by the user who tapped Sync)
5. If the WebSocket disconnects while in Manual mode, `pendingRemote` accumulates nothing (WS is down). `pendingLocal` is still flushed when Sync is tapped.
6. Queue is in-memory only. If the page reloads, the queue is lost. This is acceptable — the displayed state is the server state after reload. No data loss: the plan persists server-side.

### Mode switching

- Tap pill in Auto → switches to Manual. `pendingRemote` starts accumulating. `pendingLocal` starts accumulating.
- Tap pill in Manual with empty queues → switches back to Auto.
- Tap pill in Manual with non-empty queue → **flushes first, then switches to Auto**.

**Rationale for flush→Auto**: The user tapped to act. Forcing a second tap to return to Auto adds friction with no benefit — the fridge tablet returns to its natural state automatically, and the phone user who wanted to manually control sync has just confirmed they are done. If they want Manual again, they tap once more. One tap = one intent.

---

## UI specification

### SyncStatus pill (updated)

Auto:
```
[ ● Live ]
```
- Green dot, pulse animation
- Tap → switch to Manual mode (no flush needed)
- Touch target: full pill, min 44px height

Manual, empty queue:
```
[ ⏸ Manual ]
```
- Amber/yellow color scheme
- Tap → switch back to Auto mode

Manual, N pending:
```
[ ⏸ 3 changes pending ]
```
- Amber, no pulse
- Tap → flush (send + apply)
- Accessible label: "3 changes pending. Tap to sync."

All strings must be i18n-ready (wrapped in a translation function call once Feature 006 lands; for now, inline English is acceptable but structured as a string constant).

---

## Files changed

| File | Change |
|---|---|
| `web/src/hooks/usePlanSync.ts` | Add `syncMode`, `pendingCount`, `flush`, `setSyncMode` to return; add queue logic internally |
| `web/src/components/SyncStatus.tsx` | Rewrite to show mode-aware pill with tap handler |
| `web/src/App.tsx` | Pass `syncMode`, `setSyncMode`, `pendingCount`, `flush` down to `SyncStatus` |

No new files. No new dependencies. No config changes.

---

## Constitutional concerns

| Principle | Check |
|---|---|
| 2 — No third-party tracking | No analytics, no telemetry. `localStorage` is local-only. ✅ |
| 3 — No auth providers | No auth involved. ✅ |
| 4 — Privacy by default | No new permissions requested. ✅ |
| 5 — Spanish-ready strings | All 3 user-facing strings (`Live`, `Manual`, `N changes pending. Tap to sync.`) are inline constants — extractable to i18n in Feature 006 without structural changes. ✅ |
| 6 — Fridge tablet primary | Auto mode (fridge tablet default) is unchanged from current behavior. Manual mode is the new addition for phones. ✅ |
| 7 — Optimistic UI | Outbound edits apply to local state immediately in both modes. The Sync action is the only network delay. ✅ |
| 8 — No silent data loss | Queue is in-memory; losing it on reload means falling back to server state (not data loss — the plan persists server-side). Noted in behavior spec. ✅ |
| 9 — Touch-first, 44px min | Pill touch target explicitly specified as min 44px. ✅ |
| 10 — No scope expansion | No groceries, no settings route, no other features. ✅ |

---

## Open questions

**Q1: How does the display indicate a pending-but-unpushed local edit visually?**

Options: italic text, dotted border, amber tint on cell background, icon overlay, no indicator.

**Recommendation: amber tint on the cell background** (e.g., `bg-amber-50 border-amber-200`). Reasoning: (a) it is visible at a glance without requiring the user to read anything; (b) it is spatially accurate — the indicator is on the affected cell, not a global badge; (c) it is reversible on flush with no animation complexity; (d) it does not obscure the text. Italic or icon overlay requires the user to know the convention. Dotted borders are too subtle at tablet distance.

The amber tint applies only to cells with entries in `pendingLocal`. Cells with only `pendingRemote` changes are not tinted (the user hasn't seen those changes yet).

---

**Q2: On WebSocket reconnect in Manual mode — accumulate or refetch?**

During a WS disconnect, `pendingRemote` accumulates nothing (no messages received). On reconnect, the question is: do we silently refetch `/api/plan` to catch up on missed server-side changes, or do we wait until the user flushes?

**Recommendation: refetch on reconnect, but hold the result in `pendingRemote`, not in display state.** Reasoning: the user in Manual mode has explicitly said "don't surprise me." A silent refetch that overwrites their displayed plan violates that contract. The correct behavior is: on reconnect, call `GET /api/plan`, diff the result against current display state, and add any differing slots to `pendingRemote` as a batch. The user then sees "N changes pending" and can choose to flush. If a local edit conflicts with the post-reconnect server state on the same slot, local edit still wins at flush time (same rule as inline conflicts).

---

**Q3: "Local edit wins on same-slot conflict" — define precisely.**

The question is whether "wins" means (a) wins on local display only until pushed, or (b) wins by overwriting a newer server value when the PUT is finally sent.

**Recommendation: (b) — local edit unconditionally overwrites the server value on push.** Reasoning: this is a two-person household. Simultaneous edits to the same cell are rare. When they do occur, the person who tapped Sync last made a deliberate choice to commit. The alternative — fetching the server value and prompting the user with a merge conflict — is far too complex for this product. The spec already documents "last-write-wins" as the model. The implementation is: send `PUT /api/plan/:id` with the locally-queued patch. The server accepts it. The server's WebSocket broadcast will then inform all other clients. Simple, predictable, no special-casing.

---

**Q4: Warn before unload with non-empty queue?**

**Recommendation: no `beforeunload` prompt.** Reasoning: (a) Modern mobile browsers suppress or ignore `beforeunload` dialogs — particularly on iOS Safari, which is a primary target. (b) The app is a fridge planner, not a document editor. Losing an in-flight queue means the user sees the last-saved server state on next load — which is the whiteboard equivalent of "the marker dried up mid-write." It is recoverable by re-entering the edit. (c) `beforeunload` prompts break PWA kiosk mode (Principle 6). The correct mitigating disclosure is in the spec: the queue is in-memory, page reload discards it. This is already documented in the behavior spec under point 6 of Manual mode.

---

**Q5: Should default sync mode differ by device?**

Constitution Principle 6 names the fridge tablet as primary surface. Manual mode is explicitly designed for phone-away-from-home editing.

**Recommendation: fixed default of `'auto'`, not viewport-based detection.** Reasoning: (a) viewport width is not a reliable proxy for device role — a narrow browser window on Jesse's laptop should not behave as Manual mode. (b) The fridge tablet is the only device where `'auto'` is critical; it will always be the first device to load the app in kiosk mode. If the user never changes it, Auto is correct. (c) Viewport-based defaulting is fragile and creates surprising behavior when Dorys resizes her phone browser. (d) Feature 007 (Settings panel) will let the user explicitly set their preference. Until then, `'auto'` is the safe default. The `localStorage` key persists, so any user who manually flips to Manual on their phone will retain that preference.

---

## Acceptance criteria

- [ ] `localStorage` key `fridgeplan.syncMode` persists across page reload
- [ ] Default mode is `'auto'` on first visit
- [ ] In Auto mode, incoming WS messages update the grid immediately (existing behavior unchanged)
- [ ] In Manual mode, incoming WS messages do not update the grid until Sync is tapped
- [ ] In Manual mode, outbound edits appear optimistically in the grid but do not call the API until Sync is tapped
- [ ] Tapping the pill in Auto mode switches to Manual
- [ ] Tapping the pill in Manual mode with a non-empty queue flushes both queues and switches to Auto
- [ ] Tapping the pill in Manual mode with an empty queue switches back to Auto
- [ ] Cells with pending local edits show amber tint on cell background
- [ ] On WS reconnect in Manual mode, server delta is placed in `pendingRemote`, not applied directly to display
- [ ] `pendingCount` accurately reflects the total number of queued local + remote changes
- [ ] Pill renders correctly at 390px width (mobile) and 1024px width (tablet)
- [ ] All pill touch targets are ≥ 44px in height
- [ ] No new npm dependencies introduced

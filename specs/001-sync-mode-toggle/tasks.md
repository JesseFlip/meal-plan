# Tasks 001 — Sync-mode toggle

**Plan**: specs/001-sync-mode-toggle/plan.md  
**Branch**: feat/001-sync-mode-toggle  

---

## Task list

- [ ] 001.1 — Add syncMode state, localStorage read (SSR-safe), setSyncMode, and syncModeRef to usePlanSync
- [ ] 001.2 — Add queue refs, pendingCount, pendingSlotIds state, and refreshPending() helper to usePlanSync
- [ ] 001.3 — Update WS handler and updateSlot to branch on syncModeRef; add reconcileAfterReconnect
- [ ] 001.4 — Implement flush()
- [ ] 001.5 — Rewrite SyncStatus with mode-aware pill (three states, aria-labels, 44px min-height)
- [ ] 001.6 — Wire usePlanSync new values in App.tsx; add handleSyncToggle; pass pendingSlotIds to PlanGrid
- [ ] 001.7 — Add isPending prop to MealCell; apply amber tint (or dot fallback)

---

## Commit mapping

| Task | Commit message |
|---|---|
| 001.1 + 001.2 | `feat(sync): add syncMode persistence, queue refs, and refreshPending to usePlanSync` |
| 001.3 | `feat(sync): mode-aware WS handler, updateSlot branching, and reconnect reconciliation` |
| 001.4 | `feat(sync): implement flush()` |
| 001.5 | `feat(sync): rewrite SyncStatus with mode-aware pill` |
| 001.6 | `feat(sync): wire sync toggle and pendingSlotIds in App` |
| 001.7 | `feat(sync): add isPending amber tint to MealCell` |

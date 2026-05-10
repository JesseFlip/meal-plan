# Plan: <NNN> — <feature title>

**Status**: draft | approved | implementing | shipped
**Spec**: `./spec.md`

---

## Approach

One paragraph describing the technical strategy. How this fits into the existing architecture.

## Affected files

| File | Action | Why |
|---|---|---|
| `api/main.py` | modify | Add `/api/groceries` GET endpoint |
| `api/models.py` | create | Move models out of main.py to keep main.py under 300 lines |
| `web/src/components/GroceryList.tsx` | create | New view component |
| `web/src/hooks/usePlanSync.ts` | modify | Subscribe to grocery.updated WebSocket events |

## Data model changes

- New table? Modified column? Migration needed?
- Backwards compatibility plan: can old clients still read the response?
- If migrating: how does the migration run on Railway (alembic step in start command)?

## API changes

For each endpoint added or modified:

```
GET /api/groceries
  Response 200: GroceriesResponse
    items: list[GroceryItem]
    derived_from: list[meal_slot_id]
  Errors: none (returns empty list if no meals planned)
```

Breaking-change analysis: any existing endpoint shape changes? If yes, how do existing PWA installs handle it?

## Frontend changes

- New components: <list with one-line purpose each>
- Modified components: <list with what changes>
- New routes (if React Router added — it's not in MVP, so this requires a constitution-amending decision): <list>
- State management impact: any new global state? Any cross-component coordination?
- Service worker impact: does this affect offline cache?

## Dependencies

If any new package is needed:

| Package | Version | Why | Alternative considered |
|---|---|---|---|
| `<none in this plan>` | | | |

If you list any, expect to defend each one against `.agents/rules/coding-standards.md`'s "anti-patterns" section.

## Testing strategy

- **Unit tests**: which functions/components and what they verify
- **Integration tests**: which API endpoint flows
- **Manual verification**: what the human will do to confirm before merge

## Risk and rollback

- **Worst case**: what's the worst that happens if this ships broken?
- **Rollback**: which deploy do we revert to? How long does it take?
- **Forward-fix triggers**: under what conditions would we forward-fix instead of rolling back?

## Estimated complexity

S (≤1 day) / M (1–3 days) / L (>3 days)

L items must be split. Anything labeled L gets a follow-up `/specify` to break it down.

## Out-of-plan items

Things in the spec that this plan does NOT address. Each needs a reason.

- The mobile keyboard auto-suggest feature from the spec — descoped because keyboard suggestions are platform-controlled, not something we implement.

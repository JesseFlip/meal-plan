# specs/

This directory holds the project's specifications. Spec-driven development means:
**no code without a spec, no spec without an approved constitution.**

## Layout

```
specs/
├── README.md              ← you are here
├── constitution.md        ← inviolable principles, refined via /constitution
├── _template/             ← starting templates for new specs
│   ├── spec.md
│   ├── plan.md
│   └── tasks.md
└── NNN-<slug>/            ← one directory per feature
    ├── spec.md            ← what & why (the contract)
    ├── plan.md            ← how (the technical approach)
    └── tasks.md           ← work breakdown (atomic commits)
```

## Numbering

Feature directories are numbered sequentially: `001-foo`, `002-bar`, `003-baz`. The number is permanent — even if a feature is descoped, its number is retired, not reused. Numbers communicate chronology and let us reference a feature by its number in commits and PRs.

## Lifecycle of a feature

1. **`/specify <description>`** — creates `NNN-<slug>/spec.md` from the template and switches to a `feat/NNN-<slug>` branch.
2. **`/clarify`** — resolves ambiguities in the spec (optional, but recommended).
3. **`/plan`** — produces `plan.md` from the approved spec.
4. **`/tasks`** — produces `tasks.md` from the approved plan.
5. **Implement** — work through tasks one at a time, committing per task.
6. **`/sync-spec`** — keep `spec.md` and `plan.md` aligned with what actually shipped.
7. **`/review`** — pre-merge gate: CI, screenshots, definition of done.
8. **Open PR** — Netlify generates a preview deploy; merge after approval.
9. **Deploy** — automatic on merge to `main`.

## Statuses

A spec moves through these states (recorded in the `**Status**` header of `spec.md`):

- `draft` — initial, may still be ambiguous
- `clarified` — open questions resolved
- `planned` — plan.md exists and is approved
- `in-progress` — tasks.md exists; implementation underway
- `shipped` — merged to main and deployed
- `descoped` — abandoned; kept for history with a note explaining why

## Modifying the constitution

`constitution.md` is special. To change it, file a spec at `specs/NNN-constitutional-<slug>/` describing the change, get owner approval in writing, and merge via PR. Add an entry to the `## History` section of `constitution.md`. Do not edit `constitution.md` directly without going through this process.

## Naming conventions

- Slug: lowercase, hyphenated, ≤4 words. `add-grocery-list`, not `add-the-shopping-grocery-list-feature`.
- Title (in `spec.md`): plain English, sentence case. "Add grocery list view".
- Branch name: `feat/NNN-<slug>` for new features, `fix/NNN-<slug>` for bug fixes, `chore/<slug>` for non-feature work that doesn't need a full spec.

## What does NOT need a spec

Some changes are too small to spec. The agent should use judgment, but as a guide:

- Typo fixes in user-facing strings: no spec, direct PR with `docs:` or `fix:` prefix
- Lint or formatting changes: no spec, `chore(lint):` PR
- Dependency version bumps with no API changes: no spec, `chore(deps):` PR
- Constitution amendments: **always** a spec
- Anything touching data model, API contract, UI flow, auth, or third-party integration: **always** a spec

---
description: Generate plan.md (technical implementation plan) from an approved spec. Spec must be unambiguous before running.
---

When the user invokes `/plan`, do the following.

## 1. Preconditions

1. Identify the current spec path from the active branch.
2. Read `spec.md`. If `## Open questions` is non-empty and contains substantive items, stop and tell the user to run `/clarify` first. Do not write a plan against an ambiguous spec.
3. Read `specs/constitution.md`. The plan must conform.
4. Read `.agents/rules/coding-standards.md` and `.agents/rules/deployment.md`. The plan must conform.
5. Read `.agents/rules/codebase-map.md` if present, to understand existing structure.

## 2. Draft the plan

Copy `specs/_template/plan.md` to `specs/<NNN>-<slug>/plan.md`. The plan answers **how** — concretely, file-by-file.

The plan must include:

- **Approach** — one paragraph describing the technical strategy
- **Affected files** — list every file you'll create, modify, or delete, with one-line "why"
- **Data model changes** — schema changes, migrations needed, backwards compatibility plan
- **API changes** — new endpoints, request/response shapes, breaking-change analysis
- **Frontend changes** — components added/modified, state management impact, routing changes
- **Dependencies** — any new packages and the justification per `.agents/rules/coding-standards.md`. **No new dependencies without explicit justification.**
- **Testing strategy** — what tests will be added, at what level (unit, integration, e2e)
- **Risk and rollback** — what could break in production, how to roll back if it does
- **Estimated complexity** — rough size: S (≤1 day), M (1–3 days), L (>3 days). Anything L should be split into smaller specs.

## 3. Stack conformance check

Before showing the plan to the user, verify the plan against the constitution and rules:

- [ ] No new tech stack additions without a justification
- [ ] No new third-party services
- [ ] No breaking API changes without explicit migration plan
- [ ] CI will still pass (lint, typecheck, build)
- [ ] Deploy strategy preserves zero-downtime (idempotent migrations, etc.)

If any of these fail, fix the plan before showing it. Don't surface a non-conforming plan and ask the user to approve violations.

## 4. Show and wait

1. Commit: `docs(plan): <NNN> <slug> — implementation plan`
2. Show the plan to the user.
3. Ask whether to proceed to `/tasks` or revise.

Do not start implementing yet. Implementation happens after `/tasks`.

## 5. If the plan reveals spec gaps

If while drafting the plan you discover the spec is ambiguous or wrong, **do not silently fix it**. Stop, surface the gap, and suggest running `/clarify` again. The spec is the source of truth — the plan conforms to the spec, not the other way around.

## Anti-patterns

- Don't propose vague approaches ("refactor X for clarity"). Be specific.
- Don't list "TBD" anywhere in a plan. If you don't know, ask via `/clarify`.
- Don't introduce architecture not present in the existing codebase without justification. Match patterns.
- Don't write the plan as a wishlist. Every item is something you commit to building.
- Don't skip the rollback section. Production matters.

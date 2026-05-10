---
description: Generate or refine specs/constitution.md — the project's inviolable principles. Run once at start and any time a major principle changes.
---

When the user invokes `/constitution`, do the following.

## Inputs to read (in this order)

1. `AGENTS.md`
2. `.agents/rules/project-context.md`
3. `.agents/rules/coding-standards.md`
4. `.agents/rules/deployment.md`
5. `.agents/rules/security-and-privacy.md`
6. `docs/PRD.md`
7. The existing `specs/constitution.md` if present

## What the constitution is for

The constitution is the **non-negotiable principles** for this project. It is the document every other spec must conform to. It is shorter than the PRD and stricter than the rules. It states what we will not compromise.

A principle belongs in the constitution if and only if violating it would mean we're building a different product.

## Output structure

Write `specs/constitution.md` with these sections:

```markdown
# FridgePlan Constitution

> The non-negotiable principles for this project. Every spec, every PR, every deploy must conform. To change a principle here requires explicit owner approval — not a normal spec.

## Identity

What FridgePlan is (1 paragraph). Who the users are (named). What "done" means (one sentence).

## Inviolable Principles

Numbered list. Each principle is a single declarative sentence followed by a one-line rationale.

Example format:
1. **No third-party analytics or telemetry.** Family food data does not leave our servers.
2. **No authentication providers in MVP.** Tailscale or simple PIN — nothing more.

Aim for 8–15 principles. Fewer is suspicious. More is dilution.

## Architectural Commitments

The fixed-by-decision parts of the stack. Changing any of these requires an architectural-decision-record-style spec.

Example:
- Backend: FastAPI + SQLModel + Postgres (prod) / SQLite (dev)
- Frontend: Vite + React + TypeScript + Tailwind, no other UI frameworks
- Sync: native WebSockets only

## Process Commitments

The workflow rules — spec-driven, PR-only, CI-gated, etc. Pull these from `AGENTS.md` and `.agents/rules/deployment.md`.

## Quality Bar

Definition of done. Pull from `AGENTS.md`. Each bullet must be objectively checkable.

## Out of Scope (Permanent)

Things we have committed to NOT build. Distinguish from "Phase 3+" (which is "later"). Permanent out-of-scope items would change the product's identity.

Pull from `AGENTS.md`'s "Out of scope for v1" section, but be sharper: which of these are deferred-but-someday vs. never. Mark them.

## Amendment Process

How the constitution itself changes:
- Proposed via a spec in `specs/NNN-constitutional-amendment-<slug>/`
- Requires owner approval in writing
- Adds an entry to a `## History` section at the bottom of this file
```

## Procedure

1. Read all inputs.
2. Draft the constitution following the structure above.
3. Diff your draft against the existing `specs/constitution.md` if present. Surface the diff for the owner's review **before writing the file**.
4. Wait for explicit approval. "Looks good" is approval; silence is not.
5. After approval, write the file and commit on a branch named `chore/constitution-vN` where N increments. Open a PR. Do not push to main.
6. After merge, the constitution is law. Future specs check against it.

## Anti-patterns to avoid

- Don't pad principles with corporate-speak. "Be excellent" is not a principle.
- Don't include implementation details (those go in plans).
- Don't include feature wishes (those go in PRD).
- Don't make principles that contradict each other. Surface conflicts.
- Don't soften principles to avoid disagreement. The owner can override them — but only by saying so explicitly.

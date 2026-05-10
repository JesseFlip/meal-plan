---
description: Start a new feature. Creates a feature branch and specs/NNN-slug/spec.md from the template. Provide the feature description as the argument.
---

Usage: `/specify <one-line feature description>`

When the user invokes `/specify`, do the following.

## 1. Argument check

If no description was provided, ask: "What feature should I specify?" and stop. Do not guess.

## 2. Branch creation

1. Determine the next spec number by listing `specs/` and finding the highest `NNN-*` directory. New number is that + 1, zero-padded to 3 digits (e.g., `003`).
2. Generate a slug from the description: lowercase, hyphenated, ≤4 words. Example: "Add grocery list view" → `grocery-list-view`.
3. Create the directory: `specs/<NNN>-<slug>/`
4. Create a feature branch: `feat/<NNN>-<slug>` (or `fix/<NNN>-<slug>` if the description starts with "fix" or "bug").
5. Switch to the branch.

## 3. Constitution check (MANDATORY)

Read `specs/constitution.md`. Before drafting the spec, identify any principles this feature might bump against. If you find a potential conflict, surface it explicitly in the spec under a `## Constitutional Concerns` section. Do not silently work around the constitution.

## 4. Draft the spec

Copy `specs/_template/spec.md` to `specs/<NNN>-<slug>/spec.md`. Fill in every section based on the feature description and the constitution. Do not leave placeholder text in the file — if a section doesn't apply, write "N/A — <one-sentence reason>".

The spec must answer **why**, **what**, and **for whom** — but **not how**. How is `/plan`'s job.

Specifically, the spec must include:

- **Problem** — what's wrong today, in one paragraph
- **Users affected** — Jesse, Dorys, or both. Be specific.
- **Acceptance criteria** — testable behaviors. Each starts with "When … then …" or "Given … when … then …"
- **Out of scope** — what this feature does NOT include (prevents scope creep)
- **Open questions** — anything ambiguous. These are what `/clarify` will resolve.
- **Success metric** — how we'll know it worked, after it ships

## 5. Commit and stop

1. Commit on the branch: `docs(spec): <NNN> <slug> — initial draft`
2. Show the spec to the user.
3. Recommend one of two next steps based on the spec content:
   - If `## Open questions` is empty or trivial → suggest `/plan`
   - If `## Open questions` has substantive items → suggest `/clarify`

Do not proceed to `/plan` or `/clarify` automatically. Wait for the user.

## Anti-patterns

- Don't write implementation details ("use a Postgres column", "use React.memo"). That's planning.
- Don't bundle multiple features in one spec. If it can be split, split it — open two specs.
- Don't write a spec for "minor" changes — but if a change touches data model, API contract, UI flow, or any third-party integration, it needs a spec.
- Don't skip the "Out of scope" section. It is the second-most-important section of the spec.
- Don't write acceptance criteria you can't test. If you can't write a test for it, the criterion is too vague.

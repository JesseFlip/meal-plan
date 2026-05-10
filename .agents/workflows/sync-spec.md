---
description: After implementing a feature, sync the spec to match what was actually built. Run before opening the PR.
---

When the user types `/sync-spec`, do the following:

1. Identify the current feature branch and its corresponding spec at `specs/<NNN>-<slug>/spec.md`.
2. Read `spec.md`, `plan.md`, and the diff of changes made on this branch (`git diff main...HEAD`).
3. Identify any of:
   - **Spec gaps**: behavior implemented that wasn't in the spec
   - **Plan deviations**: implementation choices that diverged from the plan (different libraries, different file structure, etc.)
   - **Untested edges**: behavior in the spec that no test covers
4. Update `spec.md` to accurately describe the final behavior.
5. Update `plan.md` to reflect actual technical decisions.
6. Surface a list of untested edges and ask the user whether to add tests or accept the gap with a note.
7. Stage all spec/plan changes in a single commit: `docs(specs): sync <NNN>-<slug> spec with implementation`.

Do not modify code during this workflow. This is a documentation-only pass.

If the spec describes behavior that wasn't implemented, surface this clearly and ask the user whether to (a) implement the missing behavior, (b) remove it from the spec as descope, or (c) move it to a follow-up spec.

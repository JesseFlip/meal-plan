# Spec: <NNN> — <feature title>

**Status**: draft | clarified | planned | in-progress | shipped | descoped
**Created**: YYYY-MM-DD
**Owner**: Jesse
**Branch**: `feat/<NNN>-<slug>`

---

## Problem

One paragraph. What's wrong today that this feature fixes? Be concrete. "Dorys has to do X by hand" is concrete. "User experience is suboptimal" is not.

## Users affected

- Jesse / Dorys / both
- Surface they're on: fridge tablet / phone / laptop
- Frequency: how often this matters (every meal, once a week, etc.)

## Acceptance criteria

Testable behaviors. Each starts with "When …, then …" or "Given …, when …, then …".

- When a user taps an empty meal cell, then the cell opens in edit mode within 200ms.
- Given two devices are connected, when device A edits a cell, then device B reflects the change within 1 second.

If you can't write a test for it, it's not a criterion. Rewrite or drop.

## Out of scope

What this feature does NOT include. Use this section to fence against scope creep.

- Drag-and-drop meal reordering (Phase 2)
- Bulk edit of multiple cells (separate spec)
- Spanish UI strings (i18n is its own spec)

## Open questions

Things that need answering before `/plan` can run. Each is one focused question.

- Q1: When two clients edit the same slot simultaneously, what wins? (last-write-wins / merge prompt / precedence rule)
- Q2: Should the cell autosave on blur, or require an explicit save action?

Move resolved items to the `## Resolved` section below as they're answered.

## Resolved

Resolved ambiguities, with the decision and rationale. Kept for posterity.

- R1: …

## Constitutional concerns

If this feature might bump against any principle in `specs/constitution.md`, name it here and how the feature handles it. Otherwise: "None identified."

## Success metric

How will we know after shipping that this feature did its job? One or two measures.

- Dorys uses the feature within the first week without being prompted.
- The number of cells with text grows by ≥30% week-over-week.

## Notes

Anything else. Links to design files, related specs, prior conversations, etc.

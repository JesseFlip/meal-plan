---
description: Resolve ambiguities in the current spec. Asks targeted questions one at a time, encodes answers back into spec.md. Run after /specify when open questions exist.
---

When the user invokes `/clarify`, do the following.

## 1. Find the current spec

Identify the active feature branch (`git branch --show-current`). Derive the spec path: `specs/<NNN>-<slug>/spec.md`. If no spec exists for the current branch, say so and stop.

## 2. Read the spec and identify gaps

Read `spec.md` end to end. Build a list of ambiguities. These come from three places:

1. **Explicit open questions** in the `## Open questions` section.
2. **Underspecified acceptance criteria** — anywhere a behavior is described in qualitative terms ("fast", "good UX", "intuitive") rather than testable terms.
3. **Edge cases the spec doesn't address** — what happens when the network drops, when the user hits cancel, when two people edit at once, when input is empty, when input is too long, when the same item appears twice.

Prioritize ambiguities by **what would block planning**. A question about UI copy is low priority; a question about data model semantics is high priority. Tackle high priority first.

## 3. Ask questions one at a time

For each ambiguity, ask the user **one focused question**. Each question should be answerable with:

- A short selection (A / B / C)
- A single sentence
- A specific value

Do not batch 5 questions into one message. The user gets confused; the answers get crossed.

Format:

> **Q:** When two clients edit the same slot at the same time, what wins?
> **Options:**
> - **A.** Last-write-wins (current behavior — server timestamp decides)
> - **B.** Conflict detected, both versions surface as a merge prompt
> - **C.** Owner-defined precedence (Dorys's edits always win)
>
> Recommend **A** for v1; the simpler model is acceptable given two users.

The recommendation matters — it forces you to take a position rather than just offering a menu.

## 4. Encode answers back into the spec

When the user answers, **immediately** update `spec.md`:

- If the answer resolves an explicit open question, move that question into a `## Resolved` subsection or delete it.
- If the answer affects acceptance criteria, edit the criteria to be testable with the new specificity.
- If the answer reveals a new constraint, add it to the appropriate section.

Do not just append the Q&A as a transcript. The spec needs to be readable as a finished document, not as a meeting log.

## 5. Loop until done

After updating, ask the next question. Repeat until either:

- All ambiguities are resolved (you propose `/plan`)
- The user signals fatigue and is willing to accept remaining ambiguity → annotate the spec with "ACCEPTED AMBIGUITY:" notes inline and propose `/plan` with a warning

## 6. Commit

When clarification is done, commit:

```
docs(spec): <NNN> <slug> — resolve ambiguities
```

Then suggest the next step: `/plan`.

## Anti-patterns

- Don't ask questions whose answer is in the constitution. If the constitution says no third-party auth, don't ask "should we use Auth0?".
- Don't ask questions that are really planning decisions (which library, which file structure). Save those for `/plan`.
- Don't pad questions with restating the spec. Be terse. The user already wrote the spec.
- Don't accept "whatever you think is best" as an answer. Push back with a specific recommendation and confirm.

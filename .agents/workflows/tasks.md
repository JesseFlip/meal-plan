---
description: Break the approved plan into ordered atomic tasks in tasks.md. Each task is independently committable.
---

When the user invokes `/tasks`, do the following.

## 1. Preconditions

1. Identify spec path from current branch.
2. Read `spec.md` and `plan.md`. Both must exist.
3. If `plan.md` is missing, stop and tell the user to run `/plan` first.

## 2. Draft tasks

Copy `specs/_template/tasks.md` to `specs/<NNN>-<slug>/tasks.md`. Decompose the plan into **atomic tasks**.

A task is atomic when:

- It produces a single, focused commit.
- It can be reviewed in isolation.
- It leaves the system in a working state (CI passes after each task).
- It takes less than 60 minutes of focused work.

If a task is bigger than that, split it.

## 3. Task ordering rules

Order tasks so that **CI stays green at every step**. Concretely:

1. **Schema first** — migrations and data model changes go before code that depends on them.
2. **Backend before frontend** — new API endpoints land before frontend code that calls them.
3. **Implementation before refactor** — write the new thing, then remove the old thing in a separate task.
4. **Tests with their code** — don't batch all tests at the end. Each implementation task includes its tests in the same commit.

If two tasks could run in parallel, mark them with the same priority number (e.g., both as `P3`). Otherwise number them strictly sequentially.

## 4. Task format

Each task in `tasks.md` looks like this:

```markdown
### Task NNN.001 — Short imperative title

**Files**: `path/to/file.py`, `path/to/other.ts`
**Estimated time**: 30 min
**Depends on**: — (or task NNN.000)

**What**:
One sentence describing the change.

**Acceptance**:
- Bullet list of what must be true when this task is done.
- Each bullet is testable.

**Test**:
- `pytest api/tests/test_X.py::test_Y` (or specific commands)
- Manual verification step if needed
```

Use `NNN.001` numbering — the `NNN` matches the spec number, the `.001` is the task within that spec.

## 5. Sanity checks before committing tasks.md

Review the task list and confirm:

- [ ] No task touches more than ~3 files (sign of needing to split)
- [ ] No task is "miscellaneous" or "various"
- [ ] Every task has a clear "done" state
- [ ] The full sequence implements the entire plan with no gaps
- [ ] No tasks duplicate work
- [ ] Final task is "Run /sync-spec to align spec with reality" — always

## 6. Commit and wait

1. Commit: `docs(tasks): <NNN> <slug> — task breakdown`
2. Show the tasks to the user.
3. Recommend starting with the first task. Wait for the user to say "go" before implementing.

## During implementation

After each task is implemented:

1. Run the test command in the task's `**Test**` section.
2. Commit with the message: `<type>(scope): <task title> [NNN.NNN]` (Conventional Commits + task reference).
3. Update `tasks.md` to mark the task complete (change `### Task NNN.NNN` to `### ✓ Task NNN.NNN`).
4. Move to the next task.

If a task reveals the plan was wrong:
- Stop implementing.
- Update `plan.md` to reflect the corrected approach.
- Re-run `/tasks` from the affected point onward.
- Resume implementation.

## Anti-patterns

- Don't write tasks that say "implement X". Be specific about what code goes where.
- Don't batch tests as the last task. Tests ship with the code.
- Don't include "deploy" as a task. Deploy is automatic on merge to main.
- Don't create a task that's "fix anything that breaks" — that's not atomic.
- Don't skip the `**Depends on**` field. Even if it's `—`, write it.

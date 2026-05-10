# Tasks: <NNN> — <feature title>

**Spec**: `./spec.md`
**Plan**: `./plan.md`
**Status**: planning | in-progress | complete

---

## Task list

Tasks are ordered. Each task is a single commit. CI must stay green at every step.

Mark completed tasks by changing `### Task` to `### ✓ Task`.

---

### Task <NNN>.001 — <short imperative title>

**Files**: `path/to/file.py`
**Estimated time**: 20 min
**Depends on**: —

**What**:
One sentence describing the change.

**Acceptance**:
- Specific testable condition 1
- Specific testable condition 2

**Test**:
- `pytest api/tests/test_X.py::test_Y`
- (or) Manual: open the app, do X, verify Y

---

### Task <NNN>.002 — <next task>

**Files**: `path/to/other.ts`
**Estimated time**: 30 min
**Depends on**: <NNN>.001

**What**: …

**Acceptance**: …

**Test**: …

---

### Task <NNN>.NNN — Run /sync-spec to align spec with reality

**Files**: `specs/<NNN>-<slug>/spec.md`, `specs/<NNN>-<slug>/plan.md`
**Estimated time**: 10 min
**Depends on**: all prior tasks

**What**:
Update spec.md and plan.md to reflect what actually shipped. Note any descoped items. This is always the last task.

**Acceptance**:
- spec.md describes the implemented behavior, not the original intent
- plan.md reflects actual technical decisions
- No drift between docs and code

**Test**:
- Run `/sync-spec` — it should report "no drift detected"

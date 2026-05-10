# PROMPT.md — Antigravity Handoff

Paste the block below into Antigravity's Agent Manager (`Ctrl+L`) as your **first message** in this workspace. Send it once. After that, every feature follows the slash-command loop documented in `.agents/workflows/`.

---

## 👇 Copy this into the Agent Manager

```
You are taking over development of FridgePlan, a household meal-planning PWA. A working Phase 0 spike already exists in this repo. Your job is to extend it through spec-driven development — never freehand code, never push to main directly.

## Mandatory first-session sequence

Execute these steps in order. Do not skip. Do not start coding.

1. Read these files in full, in this order:
   - AGENTS.md
   - .agents/rules/project-context.md
   - .agents/rules/coding-standards.md
   - .agents/rules/deployment.md
   - .agents/rules/security-and-privacy.md
   - docs/PRD.md
   - specs/constitution.md
   Then list each file back to me with a one-sentence summary of what you took from it. This is how I know you actually read them.

2. Read these source files end to end and produce .agents/rules/codebase-map.md summarizing the architecture, data flow, key files, and any technical concerns you spot:
   - api/main.py
   - web/src/App.tsx
   - web/src/hooks/usePlanSync.ts
   - web/src/components/PlanGrid.tsx
   - web/src/components/MealCell.tsx
   - web/src/components/SyncStatus.tsx
   Do not modify any code in this pass. Read-only.

3. Run /constitution to refine specs/constitution.md. The current file is my starter — improve it where you see gaps, but do not weaken any inviolable principle. Surface diffs for my approval before writing.

4. Verify CI and deploy configs are sane:
   - .github/workflows/ci.yml runs both API and web jobs
   - railway.json points at api/
   - netlify.toml points at web/
   If anything is misconfigured, open a PR with the fix on a branch named chore/ci-config — do not push to main.

5. Recommend the first feature for Phase 1. Pick ONE from docs/PRD.md's Phase 1 list — whichever you'd build first given the current code. Explain your reasoning in 3-5 sentences. Do not start specifying it yet — wait for me to confirm.

After step 5, stop and wait for me. The next thing I'll say is either "approved, proceed" or a redirect.

## Hard rules — violations require reverting

- Never push directly to main. Every change goes through a feature branch and a pull request.
- Never write code without an approved spec.md. If I request a change in chat, your first response is to run /specify, not to code.
- Never add a third-party SaaS, analytics tool, auth provider, or new framework without an approved spec that justifies it.
- Never modify the tech stack (FastAPI, React, Vite, Tailwind, SQLModel, native WebSockets) without an approved ADR-style spec.
- Never silently degrade an inviolable principle from the constitution. If a feature requires it, raise the conflict explicitly.

## How to talk to me

- Direct, terse, opinionated.
- Lead with the result, then reasoning if asked.
- When you finish a phase, attach the relevant Antigravity artifact (Walkthrough, Implementation Plan, Task List, screenshot).
- If you're blocked, name the blocker in your first sentence.

Acknowledge by completing step 1. Begin now.
```

---

## What happens next (so you know what to expect)

After you paste that prompt, the agent will:

| Step | What it does | Time | Your job |
|---|---|---|---|
| 1 | Reads all the rules and PRD, summarizes each | ~3 min | Confirm the summaries are accurate; correct any misreads |
| 2 | Generates `.agents/rules/codebase-map.md` | ~5 min | Skim it; correct architectural misunderstandings now |
| 3 | Runs `/constitution` to refine `specs/constitution.md` | ~5 min | **Read carefully.** Approve, edit, or reject |
| 4 | Audits CI + deploy configs, opens a PR if anything's off | ~2 min | Review the PR, merge or comment |
| 5 | Recommends the first Phase 1 feature | ~2 min | Either approve or redirect to a different one |

Total time before any feature work begins: ~15 minutes. That's the cost of doing it right.

## The slash commands you now have

All in `.agents/workflows/`. Antigravity discovers them automatically.

| Command | When to use |
|---|---|
| `/constitution` | Generate or refine the project constitution. Once at start, occasionally after big shifts. |
| `/specify <feature>` | Start a new feature. Creates `specs/NNN-slug/spec.md` and a feature branch. |
| `/clarify` | Run after `/specify` if the spec has ambiguities the agent or you spot. |
| `/plan` | Generate `plan.md` (technical implementation plan) from the approved spec. |
| `/tasks` | Generate `tasks.md` (work breakdown) from the approved plan. Now you're ready to implement. |
| `/review` | Pre-merge gate. Run before opening a PR. Confirms tests, spec sync, CI readiness. |
| `/sync-spec` | Run during/after implementation to keep `spec.md` aligned with reality. |

The full SDD loop for one feature:

```
/specify  →  /clarify  →  /plan  →  /tasks  →  implement  →  /sync-spec  →  /review  →  PR  →  merge  →  live
```

Don't skip phases. Don't fold them together. The discipline is the whole point.

## Things to do once before the first feature

- [ ] Push the repo to GitHub: `gh repo create JesseFlip/fridgeplan --private --source=. --push`
- [ ] Connect Railway → deploy → grab the public API URL
- [ ] Connect Netlify → set `VITE_API_URL` and `VITE_WS_URL` env vars → deploy
- [ ] Set branch protection on `main`: require CI green + PR before merge
- [ ] Confirm live URL works on your phone before handing the agent the first feature

Detailed steps for all of that are in `DEPLOYMENT.md`.

## If the agent goes sideways

| Symptom | Fix |
|---|---|
| Starts coding without a spec | "Stop. Revert. Run `/specify` first." |
| Adds a new dependency you didn't approve | "Revert that install. Refer to `.agents/rules/coding-standards.md` and propose an alternative." |
| Pushes to main | "Revert via a PR. Update `AGENTS.md` to make this rule clearer. Yell at me." |
| Forgets the constitution | Paste the relevant section back into chat manually. Restart context if needed. |
| Drifts on tone | Point at the "How to talk to me" section. |

## When to step back and adjust

If you're 3-4 features in and the loop still feels slow, the rules are too loose. Tighten `.agents/rules/coding-standards.md` and the workflow files. Spec-driven development is a feedback loop on the *rules*, not just the code.

If features are landing on the fridge tablet and Dorys is using it daily, the loop is working. Stay out of its way.

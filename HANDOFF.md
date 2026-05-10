# Antigravity Handoff Prompt

Paste the following into Antigravity's Agent Manager (Ctrl+L) as your **first message** after opening the cloned repo. This is your one-time onboarding kickoff. After this, every feature follows the spec-driven loop.

---

## Copy/paste this 👇

```
You are taking over development of FridgePlan, a family meal-planning PWA at this repo. A working Phase 0 spike exists; your job is to extend it through spec-driven development.

Required first steps, in order:

1. Read AGENTS.md in full. Then read every file in .agents/rules/. Then read docs/PRD.md.
2. Run /speckit.constitution to create specs/constitution.md. Base it on the principles in AGENTS.md — especially the "Critical rules" section and the "Out of scope for v1" list. Get my approval before proceeding.
3. After the constitution is approved, run a repository research pass: read api/main.py, web/src/App.tsx, web/src/hooks/usePlanSync.ts, web/src/components/PlanGrid.tsx, and web/src/components/MealCell.tsx end to end. Generate .agents/rules/codebase-map.md summarizing the architecture, key data flows, and any technical debt you notice. Do NOT modify code during this pass.
4. Confirm CI is configured correctly:
   - Verify .github/workflows/ci.yml exists and runs both API and web jobs.
   - Verify netlify.toml and railway.json exist and point at the correct paths.
   - Do NOT push anything to main. Open a PR for any config tweaks.
5. Report back with:
   - Constitution draft (for my approval)
   - Codebase map summary
   - Any concerns about the existing code (correctness, security, accessibility)
   - The single first feature spec you'd recommend starting with from the Phase 1 list in docs/PRD.md

After I approve the constitution, we'll proceed feature-by-feature using /speckit.specify → /speckit.clarify → /speckit.plan → /speckit.tasks → implement → /sync-spec → PR.

Hard rules you must follow from this message forward:
- Never push to main directly. Every change goes through a feature branch and a PR.
- Never start coding without an approved spec. If I ask for a change in chat, your first response is to create the spec.
- Never add a new third-party service (analytics, error tracking, auth provider, etc.) without an explicit spec I've approved.
- Never silently change the tech stack.

Acknowledge by listing the files you've read and your proposed constitution outline. Do not begin step 3 until I confirm.
```

---

## What to expect from Antigravity after pasting this

1. **Acknowledgment + file list** (1-2 minutes). Antigravity reads `AGENTS.md`, the `.agents/rules/` files, and the PRD. It will summarize what it understood.
2. **Constitution draft** (5-10 minutes). It will draft `specs/constitution.md` and ask for your approval. Read it carefully — this is the document that constrains every future decision. Edit liberally before approving.
3. **Codebase map** (5-10 minutes). It generates `.agents/rules/codebase-map.md`. Skim it; it should be accurate. Correct any misunderstandings here, because it becomes persistent context.
4. **First spec recommendation**. It will propose the next feature. Likely candidates from the PRD's Phase 1 list:
   - Sync-mode toggle (auto vs manual push)
   - Grocery list view derived from current plan
   - Mobile-optimized edit flow
   - Kiosk-mode polish (large touch targets, dim-at-night)

Pick one. Run `/speckit.specify <feature>`. Iterate.

## Tips for the agent collaboration

- **Read the artifacts.** Antigravity generates Task Lists, Implementation Plans, and Walkthroughs. Open them. The Walkthrough is especially useful — it includes screenshots of UI changes captured by the browser subagent.
- **Use Planning mode initially.** Switch to Fast mode only after you trust how it operates on this codebase.
- **Approve specs in writing.** Don't approve via "looks good, ship it" in chat. Edit the `spec.md` directly with your changes, then say "approved."
- **Run `/sync-spec` before every PR.** That custom workflow (in `.agents/workflows/sync-spec.md`) keeps your specs from drifting from reality.
- **Don't let it work for >3 hours without a checkpoint.** Long agent runs accumulate small mistakes. Break work into 30-60 minute focused sessions.

## When the agent gets it wrong

- If it adds a new dependency: revert the package install, point at `coding-standards.md`, ask for an alternative.
- If it skips the spec: revert the code, run `/speckit.specify` for that change, and start over.
- If it pushes to main: ask it to revert via PR, then add a rule to AGENTS.md preventing it (and yell at me, the prompt author, for missing the rule).
- If it loses context: paste `AGENTS.md` and the current `spec.md` into the chat manually.

## Once it's working

The first three or four features will feel slow because you're calibrating the agent. By feature five, the loop should be:

1. You: "Add X" → it: opens a spec
2. You: edit spec, approve
3. It: implements, opens PR with passing CI + Netlify preview
4. You: click the preview, confirm it works, merge
5. Live within 3 minutes

That's the target. If it's not feeling like that by mid-Phase-1, the spec or the rules need tightening. Iterate on the rules just like you iterate on the code.

Built for Jesse Flippen, May 2026.

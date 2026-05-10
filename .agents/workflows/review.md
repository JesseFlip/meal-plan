---
description: Pre-merge review. Run after all tasks are complete, before opening the PR. Confirms CI, spec sync, screenshots, and definition of done.
---

When the user invokes `/review`, do the following.

## 1. Verify the feature is implementation-complete

1. Read `tasks.md`. Every task should be marked complete (`✓`).
2. If any tasks are incomplete, list them and ask whether to (a) finish them, (b) descope them to a follow-up spec, or (c) cancel the review.

## 2. Sync the spec with reality

Run the logic from `.agents/workflows/sync-spec.md` if it hasn't been run on this branch yet. Specifically:

1. Diff the branch against `main`.
2. Compare actual implementation against `spec.md` and `plan.md`.
3. Identify any drift:
   - Behavior implemented that wasn't in the spec
   - Plan items that weren't implemented (missing or descoped)
   - Technical choices that diverged from the plan
4. Update `spec.md` and `plan.md` to match what actually shipped. If something in the spec was descoped, note it under "## Descoped (moved to follow-up)" with a reason.
5. Commit: `docs(specs): <NNN> <slug> — sync with implementation`

## 3. Verify the Definition of Done

Walk through the checklist from `AGENTS.md` for every item:

- [ ] Linked to a spec under `specs/`
- [ ] All tests pass locally (`pytest` in `api/`, `npm run build` and `npm test` in `web/`)
- [ ] CI is green on the branch (check GitHub Actions)
- [ ] No new untyped Python or `any`-typed TypeScript without justification
- [ ] WebSocket sync verified end-to-end if applicable
- [ ] PWA still builds and installs (`npm run build` succeeds, manifest valid)
- [ ] If data model changed: migration is included and tested
- [ ] If UI changed: screenshot or recording attached to the PR
- [ ] `spec.md` reflects the final implementation

For each item that fails, stop and fix before continuing. Do not open a PR with a failed item.

## 4. Constitution conformance check

Re-read `specs/constitution.md`. Confirm the implementation does not violate any inviolable principle. If a violation exists, **stop**. Either:

- Roll back the violating change, OR
- Open a constitutional amendment spec, get owner approval, and only then merge

There is no third option.

## 5. Browser-test the change

If the feature touches the UI:

1. Build and run the frontend locally (`npm run dev`).
2. Use Antigravity's browser subagent to walk through the acceptance criteria from `spec.md`.
3. Capture screenshots of the key states.
4. Save a Walkthrough artifact.

If the feature is backend-only:

1. Run the relevant API endpoints with `curl` and capture responses.
2. Include the responses in the PR description.

## 6. PR preparation

Draft a PR description with these sections:

```markdown
## Summary
One sentence: what changed, for whom, why.

## Spec
Link to `specs/<NNN>-<slug>/spec.md`.

## Changes
Bullet list of major file-level changes.

## Testing
- Unit tests added: <list>
- Manual verification: <list>
- Screenshots: <if applicable>

## Constitution
- [ ] No principles violated
- [ ] No new third-party services
- [ ] No tech stack changes

## Deploy notes
- Migrations: <yes/no — describe>
- Env vars: <any new ones — list them>
- Rollback: <how to revert>
```

## 7. Output

1. Push the branch to the remote.
2. Open a PR using `gh pr create` with the description from step 6.
3. Add the link to the PR in chat. Stop. Wait for the user to merge.

## 8. After merge

When the user confirms the PR is merged:

1. Switch back to `main` and pull.
2. Delete the local feature branch.
3. Delete the remote feature branch.
4. Verify Netlify and Railway deploys went green.
5. Report: "Feature live at <URL>. Ready for next `/specify`."

## Anti-patterns

- Don't skip the spec-sync step "to save time". It's the most important step.
- Don't open a PR with failing CI hoping it'll be fixed in review. Fix it first.
- Don't write a vague PR description ("various improvements"). Specific or rejected.
- Don't merge before Netlify's preview deploy is green. Use the preview URL to verify.
- Don't bundle "drive-by" fixes into a feature PR. Open a separate PR.

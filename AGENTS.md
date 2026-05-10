# AGENTS.md — FridgePlan

> **Read this file first, every session.** Then `.agents/rules/` for detail. Don't skip.

## What this is

FridgePlan is a household meal-planning PWA designed to replace a magnetic whiteboard on the owner's refrigerator. Two users: Jesse (developer) and Dorys (his wife, native Spanish speaker). The product succeeds only if Dorys voluntarily uses it instead of the red dry-erase marker she's used for years. That is the only success metric that matters.

This is **not** a generic meal-planning SaaS, diet app, or calorie tracker. It's a household tool with an audience of two. Design accordingly.

## Tech stack — fixed, do not change without a spec

- **Backend**: Python 3.12, FastAPI, SQLModel, SQLite (dev) / Postgres (prod)
- **Frontend**: Vite 5, React 18, TypeScript, Tailwind 3, `vite-plugin-pwa`
- **Real-time**: native WebSockets (no Socket.IO, no Pusher, no third-party SaaS)
- **Hosting**: Railway (backend), Netlify (frontend)
- **CI**: GitHub Actions
- **Auth**: none in MVP — relies on private deployment. Do not add auth without an approved spec.

If you believe a stack change is necessary, **stop and ask**. Do not silently introduce new dependencies, frameworks, or services.

## Workflow — spec-driven, no exceptions

Every feature follows this loop:

1. **Specify** — `/speckit.specify <feature description>` creates `specs/<NNN>-<slug>/spec.md`
2. **Clarify** — `/speckit.clarify` resolves underspecified requirements with targeted questions
3. **Plan** — `/speckit.plan` produces an implementation plan
4. **Tasks** — `/speckit.tasks` breaks the plan into discrete tasks
5. **Implement** — code changes, one task at a time, with tests
6. **Verify** — run the test suite, browser-test the change, attach a Walkthrough artifact
7. **Sync** — update `spec.md` if implementation revealed gaps; run `/speckit.diff` to confirm

**Never start implementing without a spec.** If Jesse asks for a change in chat without going through `/speckit.specify`, your first response is to create the spec and ask him to confirm before coding.

The constitution (`specs/constitution.md`) lists non-negotiable principles. Create it via `/speckit.constitution` on your first run if it doesn't exist yet.

## Definition of Done

A task is done when **all** are true:

- [ ] Linked to a spec under `specs/`
- [ ] All tests pass locally (`pytest` for api, `npm run build` for web)
- [ ] CI is green on the PR
- [ ] No new untyped Python or `any`-typed TypeScript without justification
- [ ] WebSocket sync verified end-to-end (edit on one client, see update on another)
- [ ] PWA still builds and installs (`npm run build` succeeds, manifest is valid)
- [ ] If the change affects the data model: a migration is included
- [ ] If the change affects the UI: a screenshot/recording is attached to the PR via Antigravity's Walkthrough artifact
- [ ] `spec.md` reflects the final implementation (no drift)

If you cannot check all boxes, the PR is not ready.

## File layout

```
/
├── AGENTS.md                  ← this file
├── README.md                  ← developer-facing setup
├── docs/
│   └── PRD.md                 ← product requirements (Jesse-authored, source of truth for vision)
├── specs/                     ← per-feature specs (you create these via /speckit.specify)
│   ├── constitution.md
│   └── <NNN>-<slug>/
│       ├── spec.md
│       ├── plan.md
│       └── tasks.md
├── .agents/
│   ├── rules/                 ← persistent rules — read every session
│   │   ├── project-context.md
│   │   ├── coding-standards.md
│   │   ├── deployment.md
│   │   └── security-and-privacy.md
│   ├── skills/                ← (you may add domain-specific skills here)
│   └── workflows/             ← (you may add slash commands here)
├── api/                       ← FastAPI backend
│   ├── main.py
│   ├── requirements.txt
│   └── tests/                 ← pytest tests live here (create on first test task)
├── web/                       ← Vite React PWA
│   ├── src/
│   ├── public/
│   └── package.json
└── .github/
    └── workflows/
        └── ci.yml             ← lint + typecheck + build, must pass before merge
```

Do not introduce new top-level directories without a spec.

## Critical rules (most-violated, listed first)

1. **No silent scope expansion.** If the user asks for X and you think they also need Y, ask before doing Y. Don't surprise-deliver Y.
2. **No new third-party services.** No Auth0, no Firebase, no Supabase, no analytics SDKs, no Sentry, no PostHog, no Stripe. Privacy-first by default.
3. **Spanish language is a first-class concern.** Dorys is a native Spanish speaker. Any user-facing strings should be wrapped for i18n from the start, even though we ship English-only in v1.
4. **Mobile-first UI.** The fridge tablet is the primary surface. Touch targets ≥ 44px. Test in browser dev tools at 1024×600 (typical 10" tablet) and 390×844 (iPhone).
5. **No breaking API changes without migration.** The fridge tablet may be on a slightly stale PWA. Backend changes must be backwards-compatible for at least one release, or the spec must explicitly call out the breaking change.
6. **Optimistic UI everywhere.** Never make the user wait for a network round-trip to see their own action reflected. Roll back on error.
7. **WebSocket reconnect must be automatic.** No "refresh the page" prompts. Ever.
8. **No client-side storage of secrets.** API keys, tokens, credentials — all server-side. The PWA is public-readable JavaScript.
9. **No emoji-as-UI.** Dorys will use this every day for years. Functional icons (Lucide, Heroicons) over emoji.
10. **Preserve handwritten note state.** When the canvas feature ships (Phase 2), strokes are user-generated content. Treat them as precious — never silently discard, always confirm before destructive operations.

## Communication style

- Direct, opinionated, terse. The owner does not need long apologetic preambles.
- When you disagree with a request, say so once and proceed. Don't argue twice.
- Lead with what you did. Lists, not paragraphs.
- Screenshots > descriptions for UI work.
- If you're blocked, name the blocker in the first sentence.

## Out of scope for v1 (do not build these, no matter how clever the idea)

- Authentication / multi-tenancy
- Calorie tracking, macro graphs, weight tracking
- Recipe scraping or import
- ML-powered meal suggestions
- Notifications (email, SMS, push)
- Multi-language UI switching (i18n strings are wrapped, but no language picker)
- Photo upload
- Shopping list integration with grocery delivery services
- Apple Watch / wearable companion

These are explicit Phase 3+ deferrals. Mentioning them in specs is fine. Building them now is scope creep.

## When in doubt

Read `docs/PRD.md` for the why. Read `.agents/rules/` for the how. Read `specs/constitution.md` for the never-violate principles. If those don't answer the question, ask Jesse in the agent chat. Do not guess.

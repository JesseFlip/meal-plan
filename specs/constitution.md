# FridgePlan Constitution

> The non-negotiable principles for this project. Every spec, every PR, every deploy must conform. To change a principle here requires explicit owner approval via a constitutional-amendment spec — not a normal feature spec.

**Version**: 1.0 (Ratified)

---

## Identity

FridgePlan is a household meal-planning PWA that replaces a magnetic dry-erase whiteboard on the refrigerator. It serves a single household — Jesse and Dorys — and succeeds only if Dorys voluntarily uses it daily instead of the red marker she's used for years. The success bar is "Dorys-acceptable," not "users acquired," "feature parity with X," or any product-market metric.

This is not a SaaS. It is not a beachhead for a larger product. It is a tool for two people.

## Inviolable Principles

1. **Dorys is the user.** Any change that adds friction for her — relative to a whiteboard — is a regression. Edge-case features that complicate her primary flow are rejected, even if they're "easy wins" technically.

2. **No third-party tracking.** No analytics SDKs, no error reporting services, no marketing pixels, no telemetry pings. Logs stay on our server. Family food data does not leave our infrastructure.

3. **No authentication providers.** No Auth0, Firebase, Supabase, Clerk, NextAuth, or OAuth integrations. Authentication, when added, is a household-shared PIN over a private network — never federated identity.

4. **Privacy by default.** No location access, no microphone, no camera, no contacts, no calendar, no file system, unless a specific spec explicitly justifies it and the owner approves.

5. **Spanish is a first-class language.** Dorys is a native Spanish speaker. Hardcoded English strings are bugs. All user-facing text must be i18n-wrappable from creation, even when shipping English-only. **Enforcement**: Every UI component PR must be checked for hardcoded strings. If a string is added, it must be extracted to a translation key immediately.

6. **The fridge tablet is the primary surface.** Mobile is secondary; laptop is tertiary. Every UI decision is tested against "does this work for Dorys on the fridge?" first.

7. **Optimistic UI everywhere.** The user never waits on the network to see their own action. Roll back gracefully on failure.

8. **No silent data loss.** User-generated content (cell text, handwriting strokes when added) is precious. Destructive operations confirm. Edits are non-destructive until committed.

9. **Touch-first interaction.** Every interactive element works with a finger or stylus. Hover-only affordances are bugs. Minimum touch target 44×44px.

10. **No scope expansion without a spec.** Adding "while we're here" features — calorie tracking, recipe import, photo upload, ML suggestions — without a written, approved spec violates this constitution.

## Architectural Commitments

Changing any of these requires a constitutional-amendment spec, not a normal feature spec.

- **Backend**: Python 3.12+, FastAPI, SQLModel
- **Database**: SQLite (dev) / Postgres (prod)
- **Frontend**: Vite + React + TypeScript + Tailwind
- **PWA tooling**: `vite-plugin-pwa`
- **Real-time sync**: native WebSockets, no third-party real-time SaaS
- **Hosting**: Railway (backend), Netlify (frontend), GitHub (source + CI)
- **CI**: GitHub Actions
- **No monorepo tooling** (Turborepo, Nx, pnpm workspaces). Two folders, two `package.json`s.

## Process Commitments

- **Spec-driven only.** No code is written without an approved spec.
- **PR-only changes to `main`.** Direct pushes are forbidden. Branch protection enforces this.
- **CI must pass.** Lint, typecheck, build, and tests all green before merge.
- **Conventional Commits.** `feat:`, `fix:`, `docs:`, etc., with optional scope.
- **Squash merges.** Linear history on `main`.
- **One concern per PR.** No refactors bundled into feature PRs.
- **Specs sync with code.** Every PR runs `/sync-spec` before merge.
- **Atomic PRs.** Refactors, dependency updates, and feature work must never share a PR.

## Quality Bar

A change is **done** when **all** are true:

- [ ] Linked to an approved spec
- [ ] All tests pass locally and in CI
- [ ] No new `Any` (Python) or `any` (TypeScript) without justification
- [ ] WebSocket sync verified if applicable
- [ ] PWA still builds and installs
- [ ] Data model changes have migrations
- [ ] UI changes have screenshots in the PR
- [ ] `spec.md` reflects what shipped
- [ ] Constitution unchanged or formally amended

## Out of Scope — Permanent

These will never be built. Their addition would change FridgePlan's identity.

- Multi-tenancy / multi-household
- Public sign-up
- Social features (sharing, following, comments)
- Advertising or sponsored content
- Third-party recipe scraping at scale
- Meal-delivery integrations
- Marketplace / commerce

## Out of Scope — Phase 3+ (deferred, not forbidden)

These are deferrals, not prohibitions. Each requires a future spec.

- Macro / calorie tracking
- Weight tracking
- Meal photos
- Recipe library with structured ingredients
- ML-suggested swaps
- Notifications (email, SMS, push)
- Multi-language UI picker (i18n strings exist, but no in-app switcher)

## Amendment Process

To change a principle in this document:

1. Open a spec at `specs/<NNN>-constitutional-<slug>/spec.md`
2. The spec must include: which principle is changing, why, what the new wording is, and what other parts of the system this affects
3. Owner approval is required in writing in the PR
4. After merge, add an entry to `## History` below

## History

- **v1.0** (2026-05-10) — Ratified by owner. Added enforcement on Principle 5, added Atomic PRs commitment. Proposed Local-first principle rejected; offline behavior deferred to feature-level spec if/when needed.
- **v0.1** (initial draft) — bootstrapped by Claude as project handoff. Agent to refine via `/constitution` and seek owner approval to promote to v1.0.

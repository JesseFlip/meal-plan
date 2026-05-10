# Coding Standards

Universal rules first; per-language below.

## Universal

- **Conventional Commits.** `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`. Scope optional: `feat(api): ...`.
- **One concern per PR.** Don't bundle refactors with features. If a refactor is needed, do it in a prior PR.
- **No dead code.** Don't leave commented-out blocks "for later". Use git history.
- **No TODO without a ticket reference.** Either fix it now or file a spec.
- **Names describe intent, not implementation.** `getMealsForWeek()` not `queryMealsDb()`.

## Python (api/)

- Python **3.12+** only. Use modern syntax: PEP 604 union types (`str | None`, not `Optional[str]`), pattern matching where natural, walrus operator where it improves readability.
- **Type hints on everything**, including return types. `-> None` is mandatory, not implicit.
- **No `Any` without a comment** explaining why.
- Format with **Ruff** (line length 100). Lint with **Ruff** (rules: `E`, `F`, `W`, `I`, `B`, `UP`, `SIM`). Don't add Black — Ruff format is enough.
- Imports sorted by Ruff (stdlib / third-party / local).
- FastAPI conventions:
  - Use `APIRouter` if `main.py` exceeds 300 lines. Split by resource.
  - Pydantic v2 for request/response schemas. Don't return SQLModel instances directly from endpoints — convert to dict.
  - Async endpoints only when you actually do async work. Sync endpoints are fine for SQLite.
- Database:
  - SQLModel for ORM. Don't introduce SQLAlchemy directly.
  - Migrations: use **Alembic** once the schema starts changing. Until then, `SQLModel.metadata.create_all()` is acceptable for the spike.
  - Never call `session.commit()` in route handlers without a `try/except` if there's any chance of conflict.

## TypeScript / React (web/)

- TypeScript **strict mode**. `strict: true`, `noImplicitAny: true`. No `any` in checked-in code without a `// @ts-expect-error` and a comment.
- React **functional components + hooks only.** No class components.
- File naming:
  - Components: `PascalCase.tsx` (`MealCell.tsx`)
  - Hooks: `camelCase.ts` with `use` prefix (`usePlanSync.ts`)
  - Utilities: `camelCase.ts` (`formatDate.ts`)
- One component per file. Co-locate small sub-components only if they're not exported.
- **No default exports for components** except in `App.tsx` and entry files. Named exports help refactoring tools and grep.
- State management:
  - **`useState` / `useReducer`** for local UI state.
  - **Custom hooks** (`usePlanSync`) for cross-component logic.
  - **No Redux, Zustand, or Jotai** without a spec. App is small enough.
- Styling:
  - **Tailwind only.** No CSS modules, no styled-components, no emotion.
  - Use the design tokens in `tailwind.config.js`. If you need a new color/font, add it to the config — don't inline arbitrary hex values.
  - Handwriting font (Caveat) is reserved for displayed meal text only. Don't use it for UI chrome.
- Data fetching:
  - **Native `fetch`** with custom hooks. No Axios, no SWR, no TanStack Query in the spike. Add Query only via spec if state complexity demands it.
  - Always handle the loading + error + success states explicitly.
- Accessibility:
  - All interactive elements keyboard-focusable.
  - `aria-label` on icon-only buttons.
  - Touch targets ≥ 44×44 px (Tailwind: `min-h-11 min-w-11` or larger).

## Tests

- **API**: `pytest` in `api/tests/`. Use FastAPI's `TestClient`. Run via `pytest` from the `api/` directory.
- **Web**: **Vitest** + **React Testing Library**. Run via `npm test`.
- Coverage target: not 100%, not zero. Test the things that would break the product:
  - Plan CRUD round-trips
  - WebSocket broadcast on update
  - Optimistic update + rollback on failure
  - PWA service worker registration
- Don't test framework code, Tailwind classes, or styling.
- Tests live next to the unit under test for the frontend (`MealCell.test.tsx` next to `MealCell.tsx`), or in `api/tests/` mirroring the backend layout.

## Errors and edge cases

- **API**: return appropriate HTTP codes (400 for bad input, 404 for not found, 409 for conflict, 500 for unexpected). Use `HTTPException` with a structured detail message.
- **Frontend**: catch all `fetch` calls. Show inline error states, not toasts, for cell-level failures. Toasts only for app-level issues.
- **WebSocket**: assume the connection will drop. Reconnect with exponential backoff (2s → 4s → 8s, max 30s). Show a visible "Reconnecting…" indicator.
- **Empty states**: every list view must have an empty state. "No data yet" is not an empty state — write what the user should do next.

## Anti-patterns (do not do these)

- Don't write a Dockerfile unless a spec asks for one. Railway and Netlify don't need them.
- Don't add Storybook. UI is small enough that the app itself is the testbed.
- Don't introduce a monorepo tool (Turborepo, Nx, pnpm workspaces). Two folders, two `package.json`s, fine.
- Don't write a custom logger. Use Python's `logging` module and console.log. Structured logging when a spec demands it.
- Don't add ESLint *and* Prettier — let Vite's default + Tailwind's class-sort plugin handle it. If formatting drift becomes a problem, *then* add Prettier with a spec.

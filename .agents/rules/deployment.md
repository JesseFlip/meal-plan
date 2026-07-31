# Deployment & CI

## Hosting (fixed)

- **Backend**: Render (free plan). Service `fridgeplan-api`, configured via `render.yaml` at repo root.
- **Database**: Neon (free Postgres). Connection string set as `DATABASE_URL` on Render.
- **Frontend**: Netlify. Site `fridgeplan-web`. Builds from the `web/` subdirectory.
- **Domain**: TBD (Jesse will configure). Until then, use the default `*.onrender.com` and `*.netlify.app` URLs.

Both platforms auto-deploy on push to `main`. Do not introduce a manual deploy step. Do not introduce a third hosting provider without a spec.

Previously ran on Railway, then a paid EC2 instance — both retired in favor of this free Render + Neon setup (see DEPLOYMENT.md for history and rationale).

## Branch strategy

- `main` is **always deployable** and **always deployed**. Every commit on `main` flows to production within ~3 minutes.
- All work happens on **feature branches**: `feat/<slug>`, `fix/<slug>`, `refactor/<slug>`. Match the spec slug when one exists (e.g., `feat/001-grocery-list`).
- **Pull requests required** for every change to `main`. No direct pushes.
- **Squash merge only** to keep `main` history linear and readable.
- **Delete branches after merge.**

## CI requirements (must pass before merge)

GitHub Actions runs on every PR and every push to `main`:

1. **API job** (Python 3.12)
   - `pip install -r api/requirements.txt`
   - `ruff check api/`
   - `ruff format --check api/`
   - `pytest api/` (skip if no tests yet, but `pytest --collect-only` must succeed)

2. **Web job** (Node 20)
   - `npm ci` in `web/`
   - `npm run build` (TypeScript + Vite build must succeed)
   - `npm test -- --run` (skip cleanly if no tests yet)

3. **Branch protection on `main`**: require CI green + 1 approving review. (Jesse is solo for now; mark himself as required reviewer or temporarily disable until a second contributor joins.)

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | Render (set manually to the Neon connection string) | Postgres connection string |
| `ALLOWED_ORIGINS` | Render | Comma-separated allowed origins (Netlify URL) |
| `VITE_API_URL` | Netlify | Backend base URL (e.g. `https://fridgeplan-api.onrender.com`) |
| `VITE_WS_URL` | Netlify | WebSocket URL (e.g. `wss://fridgeplan-api.onrender.com/ws`) |

Never hardcode any of these. Never commit `.env` files.

Local dev defaults are baked into the code (`http://localhost:8000`, `ws://localhost:8000/ws`). Production values come from the platform environment.

## Backend deploy specifics (Render)

- `render.yaml` in repo root is the Blueprint Render reads to configure the service (root dir `api/`, free plan, health check `/api/health`).
- Render's free plan has **no persistent disk** and **sleeps after 15 min idle** (cold start ~30-50s on the next request). Neon Postgres (not SQLite) is required in production so data survives restarts.
- On schema changes, run Alembic migrations as part of the start command (e.g., `alembic upgrade head && uvicorn ...`). The agent must add this when introducing the first migration.

## Frontend deploy specifics (Netlify)

- `netlify.toml` in repo root configures:
  - Base directory: `web`
  - Build command: `npm run build`
  - Publish directory: `dist`
  - Headers for service worker scope and PWA manifest
- Netlify auto-creates PR preview deploys. Use these to verify before merge.
- Set `VITE_API_URL` and `VITE_WS_URL` in Netlify's environment variables UI.

## Database migrations

Until the first schema change, `SQLModel.metadata.create_all(engine)` in the lifespan handler is fine. Once a column is added or changed:

1. Add **Alembic** (`alembic init alembic` in `api/`)
2. Generate the migration (`alembic revision --autogenerate -m "<message>"`)
3. Commit the migration file
4. Update the Render start command (in `render.yaml`) to run `alembic upgrade head` before `uvicorn`

Do not rely on auto-table-creation in production once Alembic is introduced.

## Rollback

- Render: redeploy a previous deployment from the dashboard (one click).
- Netlify: "Publish deploy" on any previous build.
- Both are fast (<60s). Do not panic-revert via git unless the bad commit is on `main` and breaking new contributors.

## Local development

- Backend: `cd api && uvicorn main:app --reload --host 0.0.0.0 --port 8000`
- Frontend: `cd web && npm run dev` (Vite serves on `0.0.0.0:5173` by default with `--host`)
- Both should be runnable in two terminals with zero configuration changes.

## Pre-deploy checklist (for the agent)

Before any PR is merged to `main`:

- [ ] CI green
- [ ] Netlify PR preview opens, loads, and the new feature works
- [ ] If backend changes: API endpoints tested locally with `curl` (Render free plan has no PR preview environments)
- [ ] No new env vars added without documenting them in this file and setting them in Render/Netlify
- [ ] `spec.md` for this feature reflects what was actually built

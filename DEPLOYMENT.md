# Deployment Guide

End-to-end setup so merges to `main` auto-deploy to a live URL. Three accounts, ~30 minutes the first time, ~0 minutes after.

## TL;DR architecture

```
                   ┌──────────────────────────────┐
   GitHub ─────►   │  push to main / open PR      │
   `main`          └──────────────────────────────┘
                       │                  │
        ┌──────────────┘                  └──────────────┐
        ▼                                                ▼
   ┌─────────────┐                              ┌─────────────────┐
   │  Railway    │                              │  Netlify        │
   │  (backend)  │                              │  (PWA frontend) │
   │             │                              │                 │
   │  FastAPI    │  ◄──── HTTPS + WSS ────►    │  React + Vite   │
   │  Postgres   │                              │  Service Worker │
   └─────────────┘                              └─────────────────┘
        ▲                                                ▲
        │                                                │
        └──────────── Phone, Tablet, Laptop ────────────┘
                       (all via Netlify URL)
```

- **GitHub**: source of truth. CI runs on every PR.
- **Railway**: builds the API on every push to `main`, runs Uvicorn behind a managed HTTPS endpoint, gives you a managed Postgres database.
- **Netlify**: builds the PWA on every push to `main`, serves from a global CDN, runs the service worker for offline support.
- **PR previews**: Netlify spins up a unique preview URL for every PR — share with Dorys before merging.

---

## Step 1 — Push to GitHub (5 min)

You already know how to do this; skipping the basics. Just:

```bash
cd fridgeplan
git init
git add .
git commit -m "feat: phase 0 spike + antigravity handoff"
gh repo create JesseFlip/fridgeplan --private --source=. --push
```

(Or use the web UI if you prefer.) Verify `main` exists and the structure looks right on GitHub.

**Branch protection** (set this in GitHub repo settings → Branches):
- Require a pull request before merging
- Require status checks to pass (select the `api` and `web` jobs from CI once they've run once)
- Require branches to be up to date before merging
- Restrict pushes that create matching branches → `main`

---

## Step 2 — Deploy the backend to Railway (10 min)

1. Sign up / log in at https://railway.app
2. **New Project** → **Deploy from GitHub repo** → select `fridgeplan`
3. Railway detects `railway.json` and configures the build automatically. Wait for the first deploy to finish (~2 min).
4. **Add Postgres**: in the project, click **+ New** → **Database** → **PostgreSQL**. Railway provisions it and exposes `DATABASE_URL` automatically to your FastAPI service. No manual wiring.
5. **Configure environment variables** on the API service:
   - `CORS_ORIGINS` = `https://fridgeplan.netlify.app` (replace once you know the Netlify URL — Step 3)
6. **Get the public URL**: in the API service settings, click **Generate Domain**. You'll get something like `fridgeplan-api-production.up.railway.app`. Save this — you need it for Step 3.
7. **Verify**: in a browser, hit `https://YOUR-API-URL/api/health`. Should return `{"ok": true, "ts": "..."}`. Then hit `/api/plan` — should return 21 seeded slots.

**Troubleshooting**:
- If Railway can't find `main.py`: confirm `railway.json` is at the repo root and the `startCommand` includes `cd api &&`.
- If Postgres connection fails: check that `DATABASE_URL` is set on the API service (Variables tab). Sometimes you need to **Reference** the Postgres `DATABASE_URL` rather than copy it.
- If WebSocket fails in production but works locally: Railway supports WebSockets natively, but the client must use `wss://` (not `ws://`).

---

## Step 3 — Deploy the frontend to Netlify (10 min)

1. Sign up / log in at https://netlify.com
2. **Add new site** → **Import an existing project** → **GitHub** → select `fridgeplan`
3. Netlify detects `netlify.toml`. Base directory `web/`, build command `npm run build`, publish directory `dist/`. Leave these.
4. **Don't deploy yet** — click "Show advanced" and add environment variables first:
   - `VITE_API_URL` = `https://YOUR-RAILWAY-URL` (from Step 2)
   - `VITE_WS_URL` = `wss://YOUR-RAILWAY-URL/ws` (note: `wss`, not `ws`)
5. Click **Deploy site**. First build takes ~2 minutes.
6. Get the public URL: something like `https://fridgeplan-abc123.netlify.app`. You can rename in **Site settings → Change site name** to something cleaner.
7. **Go back to Railway** and update the `CORS_ORIGINS` env var on the API service to match your Netlify URL exactly. Save → Railway redeploys.
8. **Verify the full loop**:
   - Open the Netlify URL on your laptop
   - Open it again on your phone (or a second browser)
   - Edit a cell on one device
   - The other should update within 1 second

If the WebSocket doesn't connect in production, open browser DevTools → Network → WS tab. Common causes: wrong `VITE_WS_URL`, missing `wss://` protocol, or CORS misconfigured on the backend.

---

## Step 4 — Configure auto-deploy (already done, but verify)

This part is automatic — both Railway and Netlify watched your repo from Step 2 and 3. To verify:

1. Make a tiny change locally (e.g., edit the page title in `web/index.html`)
2. Commit and push to a new branch:
   ```bash
   git checkout -b test/auto-deploy
   git add . && git commit -m "test: trigger deploy preview"
   git push -u origin test/auto-deploy
   ```
3. Open a PR on GitHub.
4. Within ~30 seconds, you should see:
   - **GitHub Actions CI** running on the PR
   - **Netlify** posting a "Deploy preview ready" comment with a unique preview URL
5. Click the preview URL — your change is live there, isolated from production.
6. Merge the PR. Within ~3 minutes, Netlify deploys to production and your live site updates.

That's the loop. Every PR gets a preview. Every merge to main goes live.

---

## Step 5 — Set up the fridge tablet (15 min, one-time)

Once the PWA is live at your Netlify URL:

1. On the Android tablet, install **Fully Kiosk Browser** ($8 one-time, worth every cent — https://www.fully-kiosk.com/)
2. Open Fully Kiosk → set start URL to your Netlify URL
3. Settings to enable:
   - **Kiosk Mode**: ON (prevents accidental exit)
   - **Disable system bar**: ON
   - **Keep screen on**: ON
   - **Wake on touch**: ON
   - **Start automatically on boot**: ON
   - **Reload on idle**: every 8 hours (keeps service worker fresh)
4. Optional: set a schedule for screen dimming (e.g., 100% brightness 6 AM–10 PM, 10% otherwise) via Fully Kiosk's Screensaver settings.
5. Mount the tablet on the fridge. Plug in the charger.
6. Visit the URL on your phone, edit a cell. Watch it appear on the fridge.

---

## Common operations

### View backend logs
```bash
# Railway CLI (install once: npm i -g @railway/cli)
railway login
railway link    # link to your project
railway logs --service fridgeplan-api
```

### View frontend build logs
Netlify dashboard → **Deploys** → click the latest deploy → "Deploy log"

### Rollback a bad deploy
- **Backend**: Railway → Deployments → click any previous deployment → "Redeploy"
- **Frontend**: Netlify → Deploys → click any previous deploy → "Publish deploy"
Both take ~30 seconds.

### Update environment variables
- **Railway**: project → service → Variables tab → edit → service redeploys automatically
- **Netlify**: Site settings → Environment variables → edit → **trigger a new deploy manually** (Netlify doesn't auto-rebuild on env var changes)

### Connect to the production Postgres
```bash
# From Railway CLI
railway run psql $DATABASE_URL

# Or copy the connection string from Railway dashboard → Postgres service → Connect → "Postgres Connection URL"
psql "postgresql://..."
```

---

## Cost expectations

| Service | Free tier | Likely monthly cost |
|---|---|---|
| Railway | $5 of usage credit/month, then pay-as-you-go | **$0–5** for this app (low traffic) |
| Railway Postgres | Included in usage | Minimal — household DB is tiny |
| Netlify | 100GB bandwidth, 300 build minutes free | **$0** for this app |
| GitHub | Free for private repos with Actions (2000 min/mo) | **$0** |
| Fully Kiosk Browser | $8 one-time | $8 once |

**Realistic ongoing cost: $0–5/month** plus the one-time tablet + Fully Kiosk + mount (~$250 one-time).

If Railway usage starts climbing (it won't, but if), check the **Metrics** tab — most likely cause is the API never sleeping. Add a sleep schedule or downgrade to Hobby plan.

---

## Privacy hardening (optional, do later)

If you want to make the deployment fully private (only your devices can access it):

### Option A: Tailscale serve
Run the backend on a small VPS or your Pi inside your tailnet. Use `tailscale serve` to expose it on a `*.ts.net` URL. The Netlify PWA points to that URL.

Pro: zero public attack surface, no auth needed.
Con: your home network has to be up for the fridge to work.

### Option B: PIN auth on the backend
Add a simple PIN check middleware to the FastAPI app (one spec, ~30 min of agent work). Store the bcrypt hash in Railway env vars. The PWA prompts for the PIN once and stores a session cookie.

Pro: keeps Railway hosting, adds basic security.
Con: not zero-trust, but enough for a household app.

Both are out of scope for the spike. Do them via spec when you're ready.

---

## When something breaks

1. Check **Railway logs** for backend errors.
2. Check **browser DevTools console** for frontend errors.
3. Check **GitHub Actions** for CI failures (often the first sign something's off).
4. Check **Netlify build log** for frontend build failures.

Most production breakages are one of:
- Missing env var (CORS, API URL)
- WebSocket protocol mismatch (`ws` vs `wss`)
- Schema drift between local SQLite and Railway Postgres (add a migration)
- Service worker stuck on an old cache (bump the SW version in `vite.config.ts` or hit Fully Kiosk's "clear cache")

If you can't fix it in 15 minutes, roll back the last deploy and open a spec for the proper fix.

# Deployment Guide

> **NOTE**: This project has moved through three backends: Railway → a paid EC2 instance → **Render (free) + Neon (free Postgres)**, the current setup. EC2 was retired because it cost real money for a low-traffic household app; Render + Neon covers the same needs at $0/month. See [Retired: EC2 & Railway](#retired-ec2--railway) for history.
>
> **Cutover in progress**: `netlify.toml` still has a temporary `/api/*` and `/ws` proxy to the old EC2 IP so the live site keeps working until Netlify's `VITE_API_URL`/`VITE_WS_URL` are pointed at Render (Step 2/3 below). Once that's done and verified, delete those two redirect blocks — see the decommissioning note at the bottom of this file.

End-to-end setup so merges to `main` auto-deploy to a live URL. Three accounts, ~30 minutes the first time, ~0 minutes after. All free.

## TL;DR architecture

```
                   ┌──────────────────────────────┐
   GitHub ─────►   │  push to main / open PR      │
   `main`          └──────────────────────────────┘
                       │                  │
        ┌──────────────┘                  └──────────────┐
        ▼                                                ▼
   ┌───────────────┐    ┌──────────┐         ┌─────────────────┐
   │  Render (free)│◄──►│  Neon    │         │  Netlify        │
   │  FastAPI      │    │  Postgres│         │  (PWA frontend) │
   │  backend      │    │  (free)  │         │  React + Vite   │
   └───────┬───────┘    └──────────┘         │  Service Worker │
           │                                  └────────┬────────┘
           └──────────── HTTPS + WSS ───────────────────┘
                            ▲
                            │
           ┌────────────────┴────────────────┐
           │   Phone, Tablet, Laptop          │
           │   (all via the Netlify URL)      │
           └───────────────────────────────────┘
```

- **GitHub**: source of truth. CI runs on every PR.
- **Render**: builds the API on every push to `main` (via `render.yaml`), runs Uvicorn behind a managed HTTPS endpoint. Free plan — sleeps after 15 min idle, wakes on the next request (~30-50s cold start).
- **Neon**: managed serverless Postgres, free tier. Compute auto-suspends after 5 min idle, resumes in ~1s on the next query. Backend data lives here, not on Render (Render's free plan has no persistent disk).
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

## Step 2 — Deploy the backend to Render + Neon (10 min)

**2a. Database (Neon, free Postgres):**

1. Sign up / log in at https://neon.tech (no credit card required)
2. **New Project** → name it `fridgeplan` → pick a region close to where you'll deploy Render (e.g. US East / Ohio)
3. On the project dashboard, copy the **pooled connection string** from **Connection Details** (looks like `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require`)

**2b. Backend (Render, free web service):**

1. Sign up / log in at https://render.com
2. **New +** → **Blueprint** → connect GitHub → select `fridgeplan`
3. Render detects `render.yaml` at the repo root and configures the `fridgeplan-api` service automatically (root dir `api/`, free plan, health check `/api/health`). Click **Apply**.
4. **Set environment variables** on the service (Environment tab) — `render.yaml` declares these but leaves the values to you:
   - `DATABASE_URL` = the Neon connection string from step 2a
   - `ALLOWED_ORIGINS` = `https://fridgeplan.netlify.app` (replace once you know the Netlify URL — Step 3)
   - `GEMINI_API_KEY` = your key (for AI meal generation)
5. Save — Render redeploys automatically (~2 min first build).
6. **Get the public URL**: shown at the top of the service page, something like `fridgeplan-api.onrender.com`. Save this — you need it for Step 3.
7. **Verify**: `curl https://YOUR-RENDER-URL/api/health`. Should return `{"ok": true, "ts": "..."}`. Then hit `/api/plan` — should return 21 seeded slots. (First hit after idle takes ~30-50s — free plan cold start.)

**Troubleshooting**:
- If Render can't find `main.py`: confirm `render.yaml` is at the repo root and `rootDir: api` is set.
- If Postgres connection fails: double check you copied the *pooled* connection string from Neon (not the direct one) and that it includes `?sslmode=require`.
- If the backend seems to "reset" data periodically: you're still on SQLite. Render's free plan has no persistent disk — `DATABASE_URL` must point at Neon.
- If WebSocket fails in production but works locally: Render supports WebSockets natively, but the client must use `wss://` (not `ws://`), and the first connection after idle will hang for ~30-50s while the service wakes up.
- If the build fails with `pydantic.errors.PydanticUserError: Field 'id' requires a type annotation` (fields that clearly *do* have annotations): Render defaulted to a Python version newer than `sqlmodel==0.0.22` supports. `api/.python-version` pins this to 3.12 (matching CI) — if it's missing or Render isn't picking it up, that's the fix, not the model code.

---

## Step 3 — Deploy the frontend to Netlify (10 min)

1. Sign up / log in at https://netlify.com
2. **Add new site** → **Import an existing project** → **GitHub** → select `fridgeplan`
3. Netlify detects `netlify.toml`. Base directory `web/`, build command `npm run build`, publish directory `dist/`. Leave these.
4. **Don't deploy yet** — click "Show advanced" and add environment variables first:
   - `VITE_API_URL` = `https://YOUR-RENDER-URL` (from Step 2)
   - `VITE_WS_URL` = `wss://YOUR-RENDER-URL/ws` (note: `wss`, not `ws`)
5. Click **Deploy site**. First build takes ~2 minutes.
6. Get the public URL: something like `https://fridgeplan-abc123.netlify.app`. You can rename in **Site settings → Change site name** to something cleaner.
7. **Go back to Render** and update the `ALLOWED_ORIGINS` env var on the API service to match your Netlify URL exactly. Save → Render redeploys.
8. **Verify the full loop**:
   - Open the Netlify URL on your laptop
   - Open it again on your phone (or a second browser)
   - Edit a cell on one device
   - The other should update within 1 second

If the WebSocket doesn't connect in production, open browser DevTools → Network → WS tab. Common causes: wrong `VITE_WS_URL`, missing `wss://` protocol, or CORS misconfigured on the backend.

---

## Step 4 — Configure auto-deploy (already done, but verify)

This part is automatic — both Render and Netlify watched your repo from Step 2 and 3. To verify:

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
Render dashboard → `fridgeplan-api` service → **Logs** tab (live-tails automatically).

### View frontend build logs
Netlify dashboard → **Deploys** → click the latest deploy → "Deploy log"

### Rollback a bad deploy
- **Backend**: Render → service → **Events**/**Deploys** → click any previous deploy → "Redeploy"
- **Frontend**: Netlify → Deploys → click any previous deploy → "Publish deploy"
Both take under a minute.

### Update environment variables
- **Render**: service → Environment tab → edit → service redeploys automatically
- **Netlify**: Site settings → Environment variables → edit → **trigger a new deploy manually** (Netlify doesn't auto-rebuild on env var changes)

### Connect to the production Postgres
```bash
# Copy the connection string from the Neon dashboard → project → Connection Details
psql "postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require"
```

### Keep Render from sleeping (optional)
Render's free plan sleeps the service after 15 min idle, adding a ~30-50s cold start to the next request. For a fridge tablet that's rarely idle that long during the day, this is usually a non-issue. If it bothers you, a free uptime pinger (e.g. [UptimeRobot](https://uptimerobot.com), 5-min interval, free tier) hitting `/api/health` keeps it warm — but note this also eats into Render's 750 free instance-hours/month faster (still comfortably enough for one always-on low-traffic service).

---

## Cost expectations

| Service | Free tier | Likely monthly cost |
|---|---|---|
| Render | 750 free instance-hours/month, sleeps after 15 min idle | **$0** for this app |
| Neon Postgres | 0.5GB storage, 100 compute-hours/month, auto-suspends after 5 min idle | **$0** — household DB is tiny |
| Netlify | 100GB bandwidth, 300 build minutes free | **$0** for this app |
| GitHub | Free for private repos with Actions (2000 min/mo) | **$0** |
| Fully Kiosk Browser | $8 one-time | $8 once |

**Realistic ongoing cost: $0/month** (plus the one-time tablet + Fully Kiosk purchase, ~$250 one-time if you haven't already). This is a genuine free tier, not a trial — no credit card required for Render or Neon, and no usage-based billing to accidentally trip.

If Render's free instance-hours ever start running low, check the workspace **Usage** page — the likely cause would be multiple services on the same free account, not this one app.

---

## Privacy hardening (optional, do later)

If you want to make the deployment fully private (only your devices can access it):

### Option A: Tailscale serve
Run the backend on a small VPS or your Pi inside your tailnet. Use `tailscale serve` to expose it on a `*.ts.net` URL. The Netlify PWA points to that URL.

Pro: zero public attack surface, no auth needed.
Con: your home network has to be up for the fridge to work.

### Option B: PIN auth on the backend
Add a simple PIN check middleware to the FastAPI app (one spec, ~30 min of agent work). Store the bcrypt hash in Render env vars. The PWA prompts for the PIN once and stores a session cookie.

Pro: keeps free Render hosting, adds basic security.
Con: not zero-trust, but enough for a household app.

Both are out of scope for the spike. Do them via spec when you're ready.

---

## When something breaks

1. Check **Render logs** for backend errors (service page → Logs tab).
2. Check **browser DevTools console** for frontend errors.
3. Check **GitHub Actions** for CI failures (often the first sign something's off).
4. Check **Netlify build log** for frontend build failures.
5. If the backend is unreachable, check whether it's just asleep — Render's free plan sleeps after 15 min idle; the first request wakes it (~30-50s).

Most production breakages are one of:
- Missing env var (`ALLOWED_ORIGINS`, `VITE_API_URL`, `DATABASE_URL`)
- WebSocket protocol mismatch (`ws` vs `wss`)
- Schema drift between local SQLite and Neon Postgres (add a migration)
- Service worker stuck on an old cache (bump the SW version in `vite.config.ts` or hit Fully Kiosk's "clear cache")

If you can't fix it in 15 minutes, roll back the last deploy and open a spec for the proper fix.

---

## Retired: EC2 & Railway

The backend previously ran on Railway, then on a paid AWS EC2 instance (`50.19.129.245:8002`) after Railway usage-based billing became a concern. EC2 itself then became the higher cost — a fixed monthly bill for a low-traffic household app that mostly sits idle. It's been retired in favor of the free Render + Neon setup documented above.

If you ever need to look back at how the EC2 setup worked (webhook-based deploys, systemd services, security-group SSH issues), see the git history for this file and for `api/deploy_webhook.py` (removed) — search for the commit that removed the EC2 deploy workflows.

### Decommissioning the old EC2 instance

Once Render + Neon is verified working end-to-end (Steps 1-4 above):

1. **Remove the temporary proxy** — delete the `/api/*` and `/ws` redirect blocks from `netlify.toml` (they're clearly marked) and confirm `VITE_API_URL`/`VITE_WS_URL` on Netlify point at the Render URL, not blank/relative paths. Push and let Netlify redeploy.
2. **Verify** the live site still works end-to-end (edit a cell on one device, confirm it syncs to another).
3. **Stop the EC2 instance** in the AWS console (or terminate it, if you don't intend to reuse it) to stop the charges that prompted this migration.
4. **Revoke/rotate anything EC2-specific**: the `DEPLOY_WEBHOOK_SECRET` and `EC2_SSH_KEY` GitHub repo secrets, and the EC2 security group rules, are no longer needed once nothing points at that server.

The EC2 setup used a webhook-based deploy (GitHub → EC2-hosted `deploy_webhook.py` → `git pull` + `systemctl restart`), after SSH-from-GitHub-Actions turned out to be blocked by the EC2 security group. That whole apparatus — the webhook server, the systemd service, the security-group rules — is unnecessary with Render, which deploys directly from GitHub with no server-side listener required. The full historical writeup is preserved in this file's git history if you ever need it (`git log -p -- DEPLOYMENT.md`), and `bash check-backend.sh` now checks the Render URL instead of the EC2 IP.

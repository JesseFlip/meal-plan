# FridgePlan — Phase 0 Spike

The minimum-viable loop: edit on phone → see it update on the fridge tablet in real time.

Backend: **FastAPI + SQLite + WebSocket**
Frontend: **Vite + React + TypeScript + Tailwind + vite-plugin-pwa**

Seeded with Dorys's whiteboard plan from the May 2026 photo so you see your actual meals on first run, not Lorem Ipsum.

---

## Run it locally (10 minutes)

### 1. Backend

```bash
cd api
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend now running at `http://localhost:8000`. Test it:

```bash
curl http://localhost:8000/api/plan | python -m json.tool
```

You should see 21 slots (7 days × 3 meals) with Dorys's whiteboard text already populated.

### 2. Frontend

In a second terminal:

```bash
cd web
npm install
npm run dev
```

Open `http://localhost:5173` on your laptop. Tap a cell, edit it, hit Enter. Should save instantly.

### 3. The "wow" moment — multi-device sync

Open the same URL on your phone (use your machine's LAN IP, e.g. `http://192.168.1.50:5173`). Edit a cell on the phone. Watch the laptop update in real time. **That's the whole product.**

---

## Architecture

```
Phone PWA ──┐
            ├─► REST /api/plan (GET, PUT)        ┌─► SQLite (fridgeplan.db)
Tablet PWA ─┤                          ──► FastAPI ┤
            ├─► WebSocket /ws                     └─► ConnectionManager (broadcast)
Laptop ─────┘
```

- Any PUT triggers a broadcast to every connected WebSocket client
- Auto-reconnect with 2-second backoff if the WS drops
- Optimistic UI updates — feels instant even on slow connections
- Service worker caches `/api/plan` for offline display (network-first, 3s timeout)

## Data model

```python
MealSlot(id, day [0-6], slot [0-2], text, person, state, updated_at)

# state: planned | fasting | skipped | eaten
# person: None=both, "jesse", "dorys"
```

Slot 0 = Breakfast, 1 = Lunch, 2 = Dinner. Day 0 = Monday.

Type "fast" or "fasting" into a cell — it auto-tags state and renders italic-grey (so Saturday breakfast doesn't look like a missing entry).

---

## Deploy when you're ready

- **Backend**: push `api/` to Railway. It'll detect FastAPI and run `uvicorn`. Add Postgres later if you outgrow SQLite (you won't).
- **Frontend**: push `web/` to Netlify. Set `VITE_API_URL` and `VITE_WS_URL` env vars to your Railway URLs.
- **Even better**: run the backend on a box inside your tailnet (your Pi, your laptop, a VPS with Tailscale). Set the PWA's API URL to the tailnet IP. No public exposure, no auth needed.

---

## Fridge tablet kiosk setup

1. Install [Fully Kiosk Browser](https://www.fully-kiosk.com/) on the Android tablet
2. Point it at your deployed PWA URL
3. Settings:
   - Auto-start on boot: ON
   - Keep screen on: ON
   - Wake on touch: ON
   - Hide system UI: ON
   - Screensaver schedule: 10pm dim, 6am full bright
4. Mount on fridge. Done.

---

## What's missing (intentionally)

This is the spike. The point is to prove the loop works. Not in v0:

- ❌ Auth (Tailscale handles it)
- ❌ Multiple plans / weeks (just edit the current one)
- ❌ Grocery list (Phase 1)
- ❌ Handwriting canvas overlay (Phase 2 — once XP-Pen Android compat verified)
- ❌ Macros / photos / weight tracking (Phase 3+)
- ❌ Recipe library, ML suggestions (someday)

See `docs/PRD.md` for the full roadmap.

---

## Useful endpoints during dev

```bash
# Health check
curl http://localhost:8000/api/health

# Get current plan
curl http://localhost:8000/api/plan

# Edit a slot (id from the GET response)
curl -X PUT http://localhost:8000/api/plan/3 \
  -H "Content-Type: application/json" \
  -d '{"text": "fajita bowls"}'

# Reset to the whiteboard seed
curl -X POST http://localhost:8000/api/reset
```

---

## Hand it to Dorys

Once it's running on the fridge, walk away. Watch what she does — or doesn't do — for a week. The product question isn't "does it work?" It's "does she pick this up instead of the red marker?"

If yes → build Phase 1.
If no → ask her what's missing, fix that, try again.

Built by Jesse, May 2026.

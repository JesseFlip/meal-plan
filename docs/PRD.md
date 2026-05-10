# FridgePlan (working name) — PRD v0.1

A always-on kitchen display + PWA that turns the magnetic-whiteboard meal-planning ritual into something that syncs across devices, without losing the tactile "write it out by hand" thing Dorys loves.

> **Naming candidates** — pick whichever doesn't make you cringe: `FridgePlan`, `KitchenHQ`, `FlipPlate`, `PantryOS`, `MealBoard`, `Lumbergh's Pantry` 🤝 (steal Jim's branding pattern). Default to `FridgePlan` for this doc.

---

## 1. Vision

A magnetically-mounted Android tablet on the fridge becomes the family's meal-plan command center. Dorys writes on it with the XP-Pen the way she writes on the whiteboard today — but now it persists, syncs to a PWA on both your phones, generates the grocery list, and tracks what you actually ate. Either of you can edit from anywhere, push changes manually or auto, and the fridge display always reflects the source of truth.

**Core constraint**: it has to be *better* than the whiteboard, or Dorys will go back to the whiteboard. The bar is high.

---

## 2. Hardware Stack

| Component | Role | Notes |
|---|---|---|
| **Android tablet** (10"+) | Always-on fridge display, runs PWA in kiosk mode | LCD preferred (no OLED burn-in), USB-C with OTG, ideally 1080p |
| **XP-Pen tablet** (the Moho one) | Handwriting input on the fridge tablet | **Verify Android compatibility for your specific model** — see §9 |
| **Magnetic wall mount** | Sticks tablet to fridge | Magnetic mount + steel plate on tablet case. Skip mounts that block ports. |
| **USB-C hub or OTG cable** | Tablet ↔ XP-Pen + power simultaneously | Critical: tablet needs to charge AND accept pen input at the same time |
| **Tailscale** | Secure private network for sync | You already run it — fridge tablet, both phones, your laptop, all on tailnet |

### Hardware shopping list (if buying new)

- **Tablet**: Lenovo Tab M11 (~$200), Samsung Tab A9+ (~$220), or a refurbed Galaxy Tab S6 Lite. Avoid Amazon Fire — too locked down for kiosk PWAs.
- **Mount**: a Vesa-compatible magnetic wall mount + 3M VHB tape on the fridge if magnets aren't strong enough through the tablet case.
- **Charge management**: a USB-C charger with PD passthrough, or look at AccA (Advanced Charging Controller) on rooted devices to cap charge at 80% — extends battery life when always plugged in. This *is* a real problem; cheap tablets become paperweights in 18 months otherwise.

---

## 3. Architecture

```
┌──────────────────┐         ┌─────────────────────┐         ┌──────────────────┐
│  Phone PWA       │         │  Fridge Tablet PWA  │         │  Laptop / Web    │
│  (Jesse + Dorys) │         │  (kiosk mode)       │         │  (admin)         │
└────────┬─────────┘         └──────────┬──────────┘         └────────┬─────────┘
         │                              │                              │
         │ WebSocket (push) + REST      │                              │
         │                              │                              │
         └──────────────┬───────────────┴──────────────┬───────────────┘
                        │                              │
                        ▼                              ▼
              ┌────────────────────────────────────────────────┐
              │  FastAPI backend (Railway)                     │
              │  ─────────────────────────────────────────     │
              │  /api/plan        CRUD weekly plan             │
              │  /api/groceries   derived shopping list        │
              │  /api/canvas      handwritten note blobs       │
              │  /api/sync        WebSocket fan-out            │
              │  /api/auth        simple PIN or Tailscale ACL  │
              └────────────────────┬───────────────────────────┘
                                   │
                                   ▼
                       ┌──────────────────────┐
                       │  Postgres (Railway)  │
                       │  or SQLite for MVP   │
                       └──────────────────────┘
```

**Why this stack**: it's literally what you already shipped with `sales_dashboard`. FastAPI + React + Railway + Netlify. You have the muscle memory. The WebSocket layer is the same pattern as WrangLED — Pi proxy → WLED, here it's just backend → tablet clients.

---

## 4. Tech Stack

### Backend
- **FastAPI** — your default, fine
- **SQLite for MVP**, Postgres when you outgrow single-file (you won't, for a household app, but Railway makes it free either way)
- **WebSocket** — FastAPI's built-in `WebSocket` route or `socket.io` if you want rooms-style fan-out
- **Pydantic models** for the meal/plan schema
- **Auth**: this is just for you two — start with a 6-digit PIN stored in an env var, or skip auth entirely and rely on Tailscale ACLs (only devices on your tailnet can hit the API). Way simpler.

### Frontend (PWA)
- **Vite + React + TypeScript**
- **`vite-plugin-pwa`** for service worker, manifest, offline cache
- **Tailwind** for styling (your usual)
- **shadcn/ui** for components — you've been using it elsewhere
- **TanStack Query** for server state, **Zustand** for local UI state
- **Canvas**: `react-canvas-draw` or vanilla `<canvas>` with pointer events for the handwriting layer

### Real-time sync
- WebSocket connection from each PWA → backend
- Backend broadcasts `plan.updated`, `canvas.updated`, `groceries.updated` events
- Optimistic updates on the editing client; reconcile on receipt

### Deployment
- **Backend**: Railway (you have the workflow)
- **PWA**: Netlify (you have the workflow)
- **Tailscale**: serve backend on tailnet only — no public exposure needed for a household app

---

## 5. Data Model (sketch)

```python
# Pydantic / SQLAlchemy-ish

class MealSlot(BaseModel):
    id: UUID
    plan_id: UUID
    day: date          # 2026-05-11
    slot: Literal["breakfast", "lunch", "snack", "dinner", "late"]
    title: str         # "Greek yogurt + berries"
    body: str          # markdown details, optional
    protein_g: int | None
    carbs_g: int | None
    fat_g: int | None
    cal: int | None
    eaten_jesse: bool
    eaten_dorys: bool
    photo_url: str | None
    handwritten_canvas_id: UUID | None  # link to canvas blob if Dorys wrote it

class WeeklyPlan(BaseModel):
    id: UUID
    week_start: date
    title: str
    notes: str
    meals: list[MealSlot]

class GroceryItem(BaseModel):
    id: UUID
    plan_id: UUID
    name: str
    qty: str
    category: Literal["produce", "protein", "dairy", "pantry", "other"]
    bought: bool
    source_meal_ids: list[UUID]  # which meals contributed this item

class CanvasNote(BaseModel):
    id: UUID
    target: Literal["meal_slot", "day", "week", "freeform"]
    target_id: UUID | None
    strokes: list[dict]  # raw pointer-event data, replayable
    raster_url: str | None  # cached PNG for fast display
    created_at: datetime
    created_by: Literal["jesse", "dorys"]

class Setting(BaseModel):
    key: str
    value: str  # JSON-encoded
    # examples: sync_mode = "auto" | "manual"
    #           kitchen_close_time = "20:30"
    #           kiosk_dim_schedule = {...}
```

---

## 6. Sync Modes (your "auto vs manual push" ask)

Two settings, per-user:

- **Auto** (default for fridge tablet): receives all updates instantly via WebSocket. The fridge always shows truth.
- **Manual** (default for phones): changes queue locally; user taps "Sync" to push or pull. Useful so Dorys editing from her phone at the grocery store doesn't surprise you mid-meeting, and vice versa.

UI: a status pill in the corner — `● Live` (auto) / `⏸ 3 changes pending` (manual). Tap to flip modes or to push.

Implementation note: this is just a flag on the WS subscription. Manual = client doesn't apply pushes until user opts in; queues them in IndexedDB.

---

## 7. The Handwriting Layer (the interesting part)

This is what makes it *Dorys-acceptable* instead of just another to-do app.

**Two modes, toggle in the UI:**

### Mode A: "Whiteboard" (MVP)
- Tap any meal slot or the week header → opens a canvas overlay
- Dorys writes with the XP-Pen the way she writes on the whiteboard
- Strokes persist as a transparent PNG layered over the meal slot
- Fridge tablet displays the handwriting as-is — no OCR, no parsing, just ink
- Eraser, color picker, undo, "clear"

This alone replaces the whiteboard. Ship this first.

### Mode B: "Smart" (Phase 3+)
- Same canvas, but we run handwriting recognition on the strokes
- Suggest a parsed meal name underneath: *"Did you mean: 'Tacos de bistec'?"*
- One tap to convert to structured data; otherwise leave as ink
- Recommended HWR options:
  - **MyScript iink SDK** — best accuracy, has a free tier, supports Spanish (important for Dorys)
  - **Google ML Kit Digital Ink** — free, on-device, multi-language including Spanish
  - **handwriting.js** — open source but accuracy is meh

**Spanish handwriting matters here** — Dorys is a native Spanish speaker. ML Kit and MyScript both handle es-ES and es-MX. Don't ship without testing both languages.

### XP-Pen on Android — verify before building

Not all XP-Pen models work on Android. Check yours:

- **Works on Android (USB-C OTG)**: Deco LW, Deco MW, Deco Mini7W, Deco Pro MW, Star G640S
- **PC-only (most likely if you bought it for Moho on a laptop)**: Deco 01, Star 03/06, older Deco models
- **Bluetooth wireless models**: easier, no cable management

If your XP-Pen turns out to be PC-only on Android, fallbacks:
1. Use the tablet's built-in capacitive touch + a cheap stylus (works fine for whiteboard mode)
2. Get a wireless XP-Pen Deco MW (~$50) for Android compat
3. Pivot: keep the XP-Pen on your laptop for editing, use finger-touch on the fridge tablet

**Action item**: post the model number when you check tonight, I'll verify Android compat.

---

## 8. Always-On Display: Real-World Gotchas

You'll hit these. Plan for them.

- **Kiosk mode**: install [Fully Kiosk Browser](https://www.fully-kiosk.com/) on the fridge tablet. It locks the device to your PWA, prevents accidental exits, handles screen wake, has a JS API to control screen brightness/sleep from your app. ~$8 license worth every penny.
- **Burn-in**: avoid OLED tablets. If you're stuck with one, rotate background images and shift UI 1px every minute (Fully Kiosk has this built in).
- **Charging**: lithium batteries degrade when held at 100% 24/7. Mitigations:
  - Smart plug on a schedule (charge 7am–9am, 7pm–9pm only)
  - Rooted device + AccA app to cap at 80%
  - Just accept it and budget for a $200 tablet swap every 2 years
- **Network resilience**: tablet should keep working offline. Service worker caches the latest plan; pen input queues to IndexedDB; sync on reconnect.
- **Wake on touch / motion**: nice UX. Use the tablet's proximity sensor or just tap-to-wake. Fully Kiosk handles this.
- **Dim at night**: schedule via Fully Kiosk — full brightness 6am–10pm, dim to 10% 10pm–6am.
- **Spouse usability test**: if Dorys can't edit a meal in <10 seconds without you in the room, redesign.

---

## 9. Decisions to Make Before Coding

I'd nail these down before opening a new repo:

1. **XP-Pen model** — what's the actual SKU? Determines whether handwriting is even possible on Android v1.
2. **Android tablet** — using something you have, or buying? If buying, settle on the model now so you can test USB-C/OTG.
3. **Auth model** — Tailscale-only (simplest), or PIN + public internet (more flexible if Dorys's family wants in someday)?
4. **Spanish-first or bilingual?** — the UI should probably toggle, but does Dorys want to write meal names in Spanish and have them parsed? That changes the HWR provider choice.
5. **Scope creep guardrails** — are you actually going to track macros, or is "this week's meals + grocery list + handwritten notes" the whole product? Be honest. The latter ships in 2 weekends; the former takes 3 months.
6. **Dorys input volume** — does she want to design the v1 with you, or do you want to ship a v0.5, hand it to her, and iterate? Both are valid; I'd lean v0.5-and-iterate based on how the WrangLED build went.

---

## 10. Phased Build Plan

### Phase 0 — Spike weekend (this weekend, 4-6 hrs)
Goal: prove the loop works end-to-end with the ugliest possible UI.
- [ ] FastAPI app with `/api/plan` GET/PUT endpoints, SQLite, one hardcoded plan
- [ ] React PWA with `vite-plugin-pwa`, displays this week's plan
- [ ] WebSocket: edit on phone → updates fridge tablet within 1 sec
- [ ] Deploy backend to Railway, PWA to Netlify
- [ ] Install Fully Kiosk on the tablet, point at the PWA URL
- [ ] **Ship test**: tape tablet to fridge, edit from phone, watch it update

If this works, you have the bones. If WebSockets are flaky, drop to 5-second polling for v1 — perfectly fine for a fridge.

### Phase 1 — MVP (2 weekends)
- [ ] Weekly plan grid: 7 days × 4 slots, edit-in-place
- [ ] Manual vs auto sync toggle
- [ ] Grocery list view, derived from current plan
- [ ] PIN login or Tailscale-only access
- [ ] Mobile-friendly editing on both your phones
- [ ] Kiosk-mode polish on the fridge tablet (big touch targets, dim at night)
- [ ] **Ship to Dorys for daily use**

### Phase 2 — Handwriting (1-2 weekends)
- [ ] Canvas overlay on each meal slot
- [ ] XP-Pen integration test on Android
- [ ] Stroke persistence + replay
- [ ] Eraser, undo, clear
- [ ] Spanish + English keyboard fallback for non-pen entry

### Phase 3 — Smart features (open-ended)
- [ ] HWR via ML Kit or MyScript — auto-suggest parsed meal name
- [ ] Macro tracking per meal (optional inputs, doesn't block)
- [ ] Photo per meal — "what we actually ate"
- [ ] Weight check-ins, simple line chart
- [ ] Eating-out toggle: mark meal as "out", capture restaurant + cost

### Phase 4 — Library & ML (someday)
- [ ] Meal library: save favorites, drag onto plan
- [ ] Recipe scaling
- [ ] Suggest swaps based on macro targets
- [ ] Export plan as a printable PDF (for travel weeks)
- [ ] Multi-household / share with friends

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| XP-Pen doesn't work on your Android tablet | Test with a $5 capacitive stylus first as fallback; canvas works on touch |
| Dorys hates it after 1 week | v0.5 mindset — ship fast, accept rebuild. Don't over-architect. |
| Tablet dies in 12 months | Charge schedule + accept the $200 swap as cost of running it |
| You over-engineer auth and never ship | **Tailscale-only for v1.** Ship in 2 weekends. Add PIN later. |
| Scope creeps into a "diet app" | Re-read this PRD. The product is *plan + grocery + handwriting*. Macros are Phase 3, not Phase 1. |
| WebSockets flaky on home wifi | Fall back to 5s polling. Fine for a fridge. |
| Sugar cravings derail the actual diet | Out of scope for v1; the original meal plan handles that 😄 |

---

## 12. Repo Structure (suggested)

```
fridgeplan/
├── api/                    # FastAPI backend
│   ├── main.py
│   ├── models.py
│   ├── routes/
│   │   ├── plan.py
│   │   ├── groceries.py
│   │   ├── canvas.py
│   │   └── ws.py
│   ├── db.py
│   └── requirements.txt
├── web/                    # Vite + React PWA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Plan.tsx
│   │   │   ├── Groceries.tsx
│   │   │   └── Settings.tsx
│   │   ├── components/
│   │   │   ├── MealSlot.tsx
│   │   │   ├── HandwritingCanvas.tsx
│   │   │   └── SyncStatus.tsx
│   │   ├── store/          # Zustand stores
│   │   ├── api/            # TanStack Query hooks
│   │   └── sw.ts           # service worker config
│   ├── vite.config.ts
│   └── package.json
├── docs/
│   └── PRD.md              # this file
├── docker-compose.yml      # for local dev with one command
└── README.md
```

GitHub repo suggestion: `JesseFlip/fridgeplan` — fits your naming convention (`wrangled-dashboard`, `sales_dashboard`).

---

## 13. Content Hooks (for the blog/YouTube/TikTok pipeline)

Same content engine as WrangLED — this is a *great* build-in-public project:

- **Blog post**: "I Built a Fridge Tablet to Replace My Wife's Whiteboard" (this writes itself)
- **YouTube**: time-lapse of the build, hardware unbox, demo of pen on fridge
- **TikTok**: 30-sec "Dorys writes meal plan → it appears on my phone at the grocery store"
- **Per Scholas angle**: PWA security, Tailscale ACLs vs public auth, service worker offline strategy
- **PyTexas talk fodder**: "From Discord-controlled LEDs to a Fridge OS — Building Family-Scale Software"

---

## Next steps for tonight (if you want)

1. Find the XP-Pen model number, post it back. I'll tell you if Android works.
2. Inventory: do you have an Android tablet already, or are we shopping?
3. Pick a name (or stick with `FridgePlan`).
4. I'll generate the Phase 0 spike repo — FastAPI + Vite PWA + WebSocket loop — as a starting point you can clone and start hacking on.

This one's gonna be fun.

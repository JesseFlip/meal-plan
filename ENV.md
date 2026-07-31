# FridgePlan Environment Variables

## Backend (Render)

### Required

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
# Get this from Neon (neon.tech) — Project → Connection Details.
# Format:
# - Development: sqlite:///fridgeplan.db
# - Production: postgresql://... (Neon free Postgres; Render has no persistent disk)
```

### Optional

```env
# CORS Configuration
ALLOWED_ORIGINS=https://mealp.netlify.app
# Comma-separated list of allowed frontend origins
# Default: "*" (allow all - only use in development)
# Production example: https://mealp.netlify.app,https://custom-domain.com

# PIN Authentication (Optional)
PIN_AUTH_ENABLED=false
# Set to "true" to enable PIN-based authentication
# Default: false

PIN_SECRET=123456
# 6-digit PIN for household access
# Only used if PIN_AUTH_ENABLED=true
# Clients must send X-FridgePlan-PIN header
```

---

## Frontend (Netlify)

### Required

```env
VITE_API_URL=https://fridgeplan-api.onrender.com
# Your Render backend URL (without trailing slash)

VITE_WS_URL=wss://fridgeplan-api.onrender.com/ws
# WebSocket URL for real-time sync
# Note: wss:// for production (secure), ws:// for local development
```

---

## Local Development

### Backend (.env file in `api/` directory)

```env
DATABASE_URL=sqlite:///fridgeplan.db
ALLOWED_ORIGINS=*
PIN_AUTH_ENABLED=false
```

### Frontend (.env.local file in `web/` directory)

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
```

---

## Render Deployment

1. Go to your Render dashboard → the `fridgeplan-api` service (created from `render.yaml`)
2. Navigate to **Environment** tab
3. Add the following:
   - `DATABASE_URL=<your Neon connection string>` — Render's free plan has no persistent disk, so this must point at Neon (or another external Postgres), not SQLite
   - `ALLOWED_ORIGINS=https://mealp.netlify.app`
   - `PIN_AUTH_ENABLED=false` (or `true` if you want PIN protection)
   - `PIN_SECRET=your_6_digit_pin` (if PIN enabled)
   - `GEMINI_API_KEY=<your key>` (for AI meal generation)
4. Save — Render redeploys automatically

### Neon Postgres setup

1. Sign up at https://neon.tech (free, no credit card required)
2. **New Project** → name it `fridgeplan` → note the region (pick one close to Render's, e.g. US East)
3. Copy the connection string from the project dashboard (**Connection Details** → pick "Pooled connection" for the string, includes `?sslmode=require`)
4. Paste it into Render as `DATABASE_URL` (above)
5. Free tier: 0.5GB storage, 100 compute-hours/month, auto-suspends after 5 min idle and resumes in ~1s on the next query — plenty for a low-traffic household app

---

## Netlify Deployment

1. Go to your Netlify site settings
2. Navigate to **Site settings** → **Environment variables**
3. Add the following:
   - Key: `VITE_API_URL`
     - Value: `https://fridgeplan-api.onrender.com`
   - Key: `VITE_WS_URL`
     - Value: `wss://fridgeplan-api.onrender.com/ws`

---

## Security Best Practices

### Production Checklist

- [ ] Set `ALLOWED_ORIGINS` to your actual frontend domain (never use `*` in production)
- [ ] Enable `PIN_AUTH_ENABLED=true` if deploying publicly
- [ ] Use strong 6-digit PIN (not `123456`)
- [ ] Ensure Render's DATABASE_URL points at Neon PostgreSQL (not SQLite — Render's free plan has no persistent disk)
- [ ] Use `wss://` (secure WebSocket) in `VITE_WS_URL`

### Household Privacy

- Each household gets a unique UUID stored in browser localStorage
- No user accounts or personal data collected
- All data encrypted in transit (HTTPS/WSS)
- Database isolated by household_id

---

## Testing Environment Variables

### Backend Health Check

```bash
curl https://fridgeplan-api.onrender.com/api/health
# Should return: {"ok": true, "ts": "2026-05-25T..."}
# First request after 15 min idle takes ~30-50s (free plan cold start)
```

### Frontend Build Test

```bash
cd web
npm run build
# Should complete without errors
# Check dist/assets/ for generated files
```

---

## Troubleshooting

### CORS Errors

**Symptom**: `Access-Control-Allow-Origin` errors in browser console

**Solution**:
1. Check `ALLOWED_ORIGINS` on Render includes your Netlify domain
2. Render redeploys automatically after changing env vars — wait for it to finish
3. Verify no typos (no trailing slashes, correct protocol)

### WebSocket Connection Fails

**Symptom**: "Connecting..." never turns to "Live"

**Solution**:
1. Check `VITE_WS_URL` uses `wss://` (not `http://`)
2. Verify Render backend is running (`/api/health` returns 200) — it may need ~30-50s to wake from sleep
3. Check browser console for WebSocket errors

### PIN Authentication Fails

**Symptom**: 401 Unauthorized errors

**Solution**:
1. Verify `PIN_SECRET` matches on backend and frontend request headers
2. Check `PIN_AUTH_ENABLED=true` on Render
3. Frontend must send `X-FridgePlan-PIN` header (not yet implemented in UI)

---

## Migration Notes

### From v1.0 to v1.5 (Multi-Household)

Database migration is automatic on first start:
- Existing data migrated to default household
- New `household`, `household_settings` tables created
- All `mealslot` and `groceryitem` rows get `household_id`

**No action required** - seed function handles initialization.

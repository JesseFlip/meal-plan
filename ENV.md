# FridgePlan Environment Variables

## Backend (Railway)

### Required

```env
DATABASE_URL=postgresql://user:password@host:5432/database
# Railway auto-provisions this. Format:
# - Development: sqlite:///fridgeplan.db
# - Production: postgresql://...
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
VITE_API_URL=https://web-production-6db11.up.railway.app
# Your Railway backend URL (without trailing slash)

VITE_WS_URL=wss://web-production-6db11.up.railway.app/ws
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

## Railway Deployment

1. Go to your Railway project
2. Select the backend service
3. Navigate to **Variables** tab
4. Add the following:
   - `ALLOWED_ORIGINS=https://mealp.netlify.app`
   - `PIN_AUTH_ENABLED=false` (or `true` if you want PIN protection)
   - `PIN_SECRET=your_6_digit_pin` (if PIN enabled)
5. Railway auto-provisions `DATABASE_URL` - **do not override**

---

## Netlify Deployment

1. Go to your Netlify site settings
2. Navigate to **Site settings** → **Environment variables**
3. Add the following:
   - Key: `VITE_API_URL`
     - Value: `https://web-production-6db11.up.railway.app`
   - Key: `VITE_WS_URL`
     - Value: `wss://web-production-6db11.up.railway.app/ws`

---

## Security Best Practices

### Production Checklist

- [ ] Set `ALLOWED_ORIGINS` to your actual frontend domain (never use `*` in production)
- [ ] Enable `PIN_AUTH_ENABLED=true` if deploying publicly
- [ ] Use strong 6-digit PIN (not `123456`)
- [ ] Ensure Railway DATABASE_URL is PostgreSQL (not SQLite)
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
curl https://web-production-6db11.up.railway.app/api/health
# Should return: {"ok": true, "ts": "2026-05-25T..."}
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
1. Check `ALLOWED_ORIGINS` on Railway includes your Netlify domain
2. Restart Railway service after changing env vars
3. Verify no typos (no trailing slashes, correct protocol)

### WebSocket Connection Fails

**Symptom**: "Connecting..." never turns to "Live"

**Solution**:
1. Check `VITE_WS_URL` uses `wss://` (not `http://`)
2. Verify Railway backend is running (`/api/health` returns 200)
3. Check browser console for WebSocket errors

### PIN Authentication Fails

**Symptom**: 401 Unauthorized errors

**Solution**:
1. Verify `PIN_SECRET` matches on backend and frontend request headers
2. Check `PIN_AUTH_ENABLED=true` on Railway
3. Frontend must send `X-FridgePlan-PIN` header (not yet implemented in UI)

---

## Migration Notes

### From v1.0 to v1.5 (Multi-Household)

Database migration is automatic on first start:
- Existing data migrated to default household
- New `household`, `household_settings` tables created
- All `mealslot` and `groceryitem` rows get `household_id`

**No action required** - seed function handles initialization.

# FridgePlan Deployment Checklist

**Status**: Code pushed to GitHub (commit e11c0b6)
**Date**: May 25, 2026
**Awaiting**: Railway + Netlify auto-deployment

---

## ✅ Completed Implementation

### Phase 1 MVP
- [x] Feature 001: Sync Mode Toggle (verified complete)
- [x] Feature 002: Grocery List
  - [x] Backend endpoints (`/api/groceries/*`)
  - [x] Smart ingredient parsing (60+ EN/ES ingredients)
  - [x] Frontend UI with category grouping
  - [x] Tab navigation (Meal Plan | Groceries)

### Phase 1.5 (Multi-Household)
- [x] Household model with UUID
- [x] HouseholdSettings model
- [x] `household_id` foreign keys on MealSlot and GroceryItem
- [x] Household initialization endpoint (`/api/household/init`)
- [x] Settings management endpoints
- [x] Dietary restrictions filter
- [x] Frontend localStorage household ID handling
- [x] All API requests include `X-Household-ID` header

### Additional Features
- [x] i18n foundation (English + Spanish)
- [x] Language switcher UI component
- [x] Configurable CORS
- [x] Optional PIN authentication
- [x] Test infrastructure (pytest + Vitest)
- [x] Comprehensive documentation

---

## ⚠️ Railway Backend Status

**Current State**: 502 Bad Gateway

### Possible Issues

1. **Database Migration Required**
   - New tables: `household`, `household_settings`
   - New columns: `household_id` on `mealslot` and `groceryitem`
   - SQLite → PostgreSQL migration may be needed

2. **Environment Variables**
   - Check `ALLOWED_ORIGINS` is set to: `https://mealp.netlify.app`
   - Verify `DATABASE_URL` is PostgreSQL (not SQLite)

3. **Startup Error**
   - Check Railway logs for errors
   - Look for database connection issues
   - Check for table creation failures

### Action Items

1. **Check Railway Logs**:
   ```
   Railway Dashboard → Service → Logs
   ```
   Look for:
   - Database connection errors
   - Table creation errors
   - Python import errors

2. **Verify DATABASE_URL**:
   - Should be: `postgresql://...` (not `sqlite://...`)
   - Railway auto-provisions PostgreSQL
   - If missing, add PostgreSQL plugin to Railway project

3. **Manual Database Reset** (if needed):
   - The `seed_if_empty()` function will auto-create tables
   - But only if database is completely empty
   - For existing databases, may need manual migration

4. **Test Locally First**:
   ```bash
   cd api
   uv run uvicorn main:app --reload
   # Visit: http://localhost:8000/api/health
   ```

---

## 🚀 Netlify Frontend Status

**Expected State**: Deployed with new features

### What to Verify

Visit https://mealp.netlify.app/ and check for:

1. **Header**:
   - [ ] "Meal Plan" title
   - [ ] "Week of [date range]" subtitle
   - [ ] Language switcher (EN | ES) in top-right
   - [ ] SyncStatus pill (green "Live" or amber "Manual")

2. **Tab Navigation**:
   - [ ] Two tabs: "Meal Plan" | "Groceries"
   - [ ] Tab switching works

3. **Meal Plan View**:
   - [ ] 7×3 grid visible
   - [ ] Day headers (MON-SUN)
   - [ ] Meal labels (Breakfast, Lunch, Dinner)
   - [ ] Cells are editable (click to edit)
   - [ ] Changes sync in real-time

4. **Groceries View**:
   - [ ] Category sections (Produce, Protein, Dairy, Pantry, Other)
   - [ ] "Add something to the list..." input
   - [ ] "Refresh from Plan" button
   - [ ] "Clear Bought" button
   - [ ] Items can be toggled (bought/not bought)

5. **Language Switcher**:
   - [ ] Click "ES" → UI changes to Spanish
   - [ ] Click "EN" → UI changes to English
   - [ ] Language persists on reload

### If Frontend Doesn't Load New Features

1. **Check Netlify Deploy Logs**:
   ```
   Netlify Dashboard → Deploys → Latest Deploy
   ```

2. **Verify Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Base directory: `web`

3. **Check Environment Variables**:
   - `VITE_API_URL=https://web-production-6db11.up.railway.app`
   - `VITE_WS_URL=wss://web-production-6db11.up.railway.app/ws`

4. **Force Redeploy**:
   - Netlify Dashboard → Deploys → Trigger deploy → "Clear cache and deploy site"

---

## 🔧 Manual Testing Checklist

Once both deployments are live:

### Backend Tests
```bash
# Health check
curl https://web-production-6db11.up.railway.app/api/health
# Should return: {"ok": true, "ts": "..."}

# Initialize household
curl -X POST https://web-production-6db11.up.railway.app/api/household/init \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Household"}'
# Should return: {"id": "uuid...", "name": "Test Household", "created_at": "..."}

# Get meal plan (use household_id from above)
curl https://web-production-6db11.up.railway.app/api/plan \
  -H "X-Household-ID: your-uuid-here"
# Should return: array of 21 meal slots
```

### Frontend Tests

1. **First Visit (New Household)**:
   - Open browser DevTools → Console
   - Visit https://mealp.netlify.app/
   - Should see: Household initialized automatically
   - Check localStorage: `fridgeplan.householdId` should exist

2. **Meal Plan Editing**:
   - Click any cell
   - Type "Chicken Salad"
   - Press Enter
   - Should save and show green "Live" indicator

3. **Sync Mode Toggle**:
   - Click green "Live" pill
   - Should turn amber "Manual"
   - Edit a cell
   - Should see amber dot on cell (pending)
   - Click "1 changes pending" pill
   - Should flush changes and turn green

4. **Grocery List**:
   - Click "Groceries" tab
   - Click "Refresh from Plan"
   - Should extract ingredients from meal plan
   - Add manual item: "Bananas"
   - Toggle item as bought (should strikethrough)
   - Click "Clear Bought"
   - Bought items should disappear

5. **Language Switching**:
   - Click "ES" button
   - UI should translate to Spanish:
     - "Meal Plan" → "Plan de Comidas"
     - "Groceries" → "Compras"
     - "Breakfast" → "Desayuno"
   - Reload page → Should remember language preference

6. **Multi-Device Sync** (optional):
   - Open app on two devices
   - Edit meal on Device 1
   - Should appear instantly on Device 2

---

## 🐛 Known Issues & Workarounds

### Issue 1: Railway 502 on Initial Deploy

**Cause**: New database schema requires table creation

**Solution**:
1. Wait 2-3 minutes for Railway to complete deployment
2. Check logs for "Uvicorn running on..."
3. If still 502, trigger manual redeploy in Railway dashboard

### Issue 2: Frontend Shows "No household found"

**Cause**: Household initialization failed due to backend 502

**Solution**:
1. Clear browser localStorage
2. Refresh page
3. Should auto-create household on next load

### Issue 3: WebSocket "Connecting..." Never Turns Green

**Cause**: Railway backend not responding to WebSocket connections

**Solution**:
1. Verify `VITE_WS_URL` uses `wss://` (not `ws://`)
2. Check backend is responding to HTTP first (`/api/health`)
3. Try hard refresh (Ctrl+Shift+R) on frontend

### Issue 4: CORS Errors in Browser Console

**Cause**: `ALLOWED_ORIGINS` not set on Railway

**Solution**:
1. Railway Dashboard → Variables
2. Add: `ALLOWED_ORIGINS=https://mealp.netlify.app`
3. Restart service

---

## 📊 Deployment Metrics

**Total Changes**:
- Files modified: 3
- Files created: 13
- Lines added: ~2,334
- Lines removed: 40

**New Endpoints** (8):
- `POST /api/household/init`
- `GET /api/household/settings`
- `PUT /api/household/settings`
- `GET /api/groceries`
- `POST /api/groceries`
- `PATCH /api/groceries/{id}`
- `POST /api/groceries/clear`
- `POST /api/groceries/sync`

**New Frontend Components** (3):
- `GroceryView.tsx`
- `LanguageSwitcher.tsx`
- Tab navigation in `App.tsx`

**New Hooks** (2):
- `useGroceries.ts`
- `useTranslation.ts`

---

## ✅ Success Criteria

Deployment is successful when:

- [ ] Railway health endpoint returns 200 OK
- [ ] Netlify shows new UI with tabs and language switcher
- [ ] Can create and edit meal plan
- [ ] Can add and toggle grocery items
- [ ] Language switcher works (EN/ES)
- [ ] WebSocket shows green "Live" status
- [ ] Changes sync across multiple tabs
- [ ] No console errors in browser DevTools

---

## 🆘 Emergency Rollback

If deployment fails catastrophically:

```bash
cd fridgeplan
git revert HEAD
git push origin main
```

This will revert to the previous working version.

---

## 📞 Next Steps

1. **Wait 5-10 minutes** for Railway/Netlify to complete deployment
2. **Check Railway logs** for any startup errors
3. **Visit frontend** at https://mealp.netlify.app/
4. **Test all features** using checklist above
5. **Report any issues** found during testing

If everything works:
- ✅ Mark this issue as resolved
- 📝 Update OPTIMIZATION_REPORT.md with deployment results
- 🎉 Celebrate Phase 1.5 completion!

# FridgePlan Tri-Screen Hardware Integration Plan

**Date**: May 26, 2026
**Hardware Configuration**: Jesse's Physical Refrigerator Setup

---

## 🖥️ Your Hardware Specifications

### Center Display: Gateway Monitor
- **Dimensions**: 14.5" x 11" (de-bezeled)
- **Resolution**: 1024x768 (4:3 aspect ratio)
- **Purpose**: Main meal planning interface
- **Mounting**: Center of refrigerator door

### Left Display: Amazon Fire Tablet
- **Dimensions**: 7.25" x 5.5"
- **Resolution**: ~1024x600 (estimated)
- **Purpose**: Grocery checklist & pantry tracker
- **Mounting**: Left flank of refrigerator door

### Right Display: Samsung Galaxy Tab 3
- **Dimensions**: 7.25" x 5.5"
- **Resolution**: ~1024x600 (estimated)
- **Purpose**: Cooking timers & fridge telemetry
- **Mounting**: Right flank of refrigerator door

---

## 🎯 Local Server Access URLs

**Backend API**: `http://localhost:8000` (or `http://192.168.0.122:8000` from tablets)
**Frontend**:
- Local: `http://localhost:5173`
- Network (Gateway): `http://192.168.0.122:5173`
- Network (Tablets): Same URL, different viewports

**All three devices will connect to the same backend server running on your local network.**

---

## 📋 Feature Mapping: Mockup → FridgePlan

### From Your Mockup HTML

| Feature | Status in FridgePlan | Implementation Notes |
|---------|---------------------|---------------------|
| **Tri-Screen Physical Simulator** | ❌ Not implemented | Need to add visual mockup page |
| **Weekly Calendar Scheduler** | ✅ Implemented | PlanGrid component (7x3 meal grid) |
| **Meal Selection Dropdowns** | ✅ Implemented | Inline editing in cells |
| **Macro Nutrition Chart** | ❌ Not implemented | Can add Chart.js radar visualization |
| **Grocery Checklist** | ✅ Implemented | GroceryView with category grouping |
| **Pantry Inventory Tracker** | ❌ Not implemented | Need fresh ingredient expiration system |
| **Cooking Timers** | ❌ Not implemented | Need timer component with WebSocket sync |
| **Fridge Telemetry** | ❌ Not implemented | Optional IoT integration |
| **Family Notes Board** | ❌ Not implemented | Can add shared notes feature |
| **Device-Specific Layouts** | ❌ Not implemented | Need responsive breakpoints |

---

## 🏗️ Architecture for Tri-Screen Setup

### Current FridgePlan Architecture
```
┌─────────────────────────────────────────┐
│  Single Unified Web App                 │
│  (Works on all screens)                 │
│                                         │
│  - Plan Grid                            │
│  - Grocery List                         │
│  - Language Switcher                    │
│  - Sync Status                          │
└─────────────────────────────────────────┘
         ↕ WebSocket + REST
┌─────────────────────────────────────────┐
│  FastAPI Backend (Port 8000)            │
│  - Household Management                 │
│  - Meal Plan CRUD                       │
│  - Grocery List CRUD                    │
│  - Real-time Sync                       │
└─────────────────────────────────────────┘
```

### Proposed Tri-Screen Architecture
```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  LEFT TABLET     │  │  CENTER GATEWAY  │  │  RIGHT TABLET    │
│  (Fire)          │  │  (Main Monitor)  │  │  (Samsung Tab 3) │
│                  │  │                  │  │                  │
│  GROCERY MODE    │  │  FULL DASHBOARD  │  │  TIMER MODE      │
│  - Checklist     │  │  - Meal Grid     │  │  - Cook Timers   │
│  - Pantry        │  │  - Analytics     │  │  - Notes Board   │
│  - Add Items     │  │  - Multi-view    │  │  - Temp Monitor  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
         ↕                    ↕                    ↕
         └────────────────────┴────────────────────┘
                              ↕
                   ┌──────────────────────┐
                   │  Shared Backend      │
                   │  (Single Server)     │
                   │  - Synced State      │
                   │  - WebSocket Events  │
                   └──────────────────────┘
```

---

## 🎨 Implementation Strategy

### Phase A: Device Detection & Responsive Layouts (2-3 hours)

**1. Add Device Detection Hook**
```typescript
// web/src/hooks/useDeviceType.ts
export function useDeviceType() {
  const width = window.innerWidth
  const height = window.innerHeight

  if (width >= 1024 && height >= 768) {
    return 'gateway'  // Center monitor
  } else if (width >= 600 && width < 1024) {
    return 'tablet'   // Side tablets
  } else {
    return 'mobile'   // Phones
  }
}
```

**2. Add View Mode Selection**
```typescript
// web/src/App.tsx
const device = useDeviceType()
const [viewMode, setViewMode] = useState<'auto' | 'grocery' | 'timer' | 'full'>('auto')

// Auto-select view based on device
useEffect(() => {
  if (viewMode === 'auto') {
    if (device === 'gateway') setViewMode('full')
    else if (device === 'tablet') {
      // Check localStorage for saved preference
      const saved = localStorage.getItem('tablet.viewMode')
      setViewMode(saved as any || 'grocery')
    }
  }
}, [device, viewMode])
```

### Phase B: Specialized Views (3-4 hours)

**3. Grocery-Only View (Left Tablet)**
- Full-screen GroceryView
- Large touch targets (60px minimum)
- Hide meal plan completely
- Focus on add/toggle/clear operations

**4. Timer View (Right Tablet)**
- New `TimerView` component
- Multiple concurrent timers
- Large countdown displays
- Audio notifications
- Family notes textarea

**5. Gateway Full Dashboard**
- Current layout (meal grid + grocery tabs)
- Add macro chart visualization
- Add weekly overview calendar
- Keep all navigation visible

---

## 🔧 Technical Implementation Details

### 1. URL Query Parameters for Device Assignment

Each device loads the same app but with different query params:

**Gateway Monitor**:
```
http://192.168.0.122:5173/?device=gateway
```

**Left Tablet (Grocery)**:
```
http://192.168.0.122:5173/?device=tablet&view=grocery
```

**Right Tablet (Timers)**:
```
http://192.168.0.122:5173/?device=tablet&view=timer
```

### 2. Backend Timer Management

Add new endpoints for timer synchronization:

```python
# api/main.py additions

class CookingTimer(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    household_id: str = Field(foreign_key="household.id")
    name: str
    duration_seconds: int
    elapsed_seconds: int = 0
    is_running: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

@app.get("/api/timers")
def get_timers(household_id: str = Header(None, alias="X-Household-ID")):
    """Get all active timers for household."""
    ...

@app.post("/api/timers")
def create_timer(payload: dict, household_id: str = Header(None, alias="X-Household-ID")):
    """Create a new timer."""
    ...

@app.patch("/api/timers/{timer_id}")
async def update_timer(timer_id: int, payload: dict, ...):
    """Start/pause/reset timer and broadcast to all clients."""
    ...
```

### 3. WebSocket Timer Tick Broadcasts

```python
# Every second, broadcast active timer states
@app.on_event("startup")
async def start_timer_broadcaster():
    asyncio.create_task(timer_broadcast_loop())

async def timer_broadcast_loop():
    while True:
        await asyncio.sleep(1)
        with Session(engine) as session:
            active_timers = session.exec(
                select(CookingTimer).where(CookingTimer.is_running == True)
            ).all()

            for timer in active_timers:
                timer.elapsed_seconds += 1
                if timer.elapsed_seconds >= timer.duration_seconds:
                    timer.is_running = False
                session.add(timer)

            session.commit()

            # Broadcast all timer states
            for timer in active_timers:
                await manager.broadcast({
                    "type": "timer.tick",
                    "household_id": timer.household_id,
                    "data": timer_to_dict(timer)
                })
```

---

## 📱 Kiosk Mode Setup (Fully Kiosk Browser)

### For Amazon Fire Tablet

**Installation**:
1. Enable "Unknown Sources" in Settings → Security
2. Download Fully Kiosk Browser APK from: https://www.fully-kiosk.com/
3. Install and grant all permissions

**Configuration**:
```json
{
  "startURL": "http://192.168.0.122:5173/?device=tablet&view=grocery",
  "screensaver": false,
  "screenBrightness": 70,
  "motionDetection": true,
  "kioskMode": true,
  "showSystemBar": false,
  "enableZoom": false,
  "preventSleep": true,
  "scheduledRestart": "03:00"
}
```

### For Samsung Galaxy Tab 3

Same configuration but different view parameter:
```json
{
  "startURL": "http://192.168.0.122:5173/?device=tablet&view=timer",
  ...
}
```

---

## 🎨 CSS Breakpoints for Tri-Screen

```css
/* Gateway Monitor (14.5" x 11" → 1024x768) */
@media (min-width: 1024px) and (min-height: 768px) {
  .gateway-only { display: block; }
  .tablet-only { display: none; }
  .mobile-only { display: none; }

  /* Larger fonts, more whitespace */
  body { font-size: 18px; }
  .meal-cell { min-height: 100px; }
}

/* Tablets (7.25" x 5.5" → ~600x1024 portrait or 1024x600 landscape) */
@media (min-width: 600px) and (max-width: 1023px) {
  .gateway-only { display: none; }
  .tablet-only { display: block; }
  .mobile-only { display: none; }

  /* Optimize for touch */
  button { min-height: 60px; min-width: 60px; }
  input { font-size: 20px; padding: 16px; }
}

/* Mobile Phones (fallback) */
@media (max-width: 599px) {
  .gateway-only { display: none; }
  .tablet-only { display: none; }
  .mobile-only { display: block; }
}
```

---

## 🚀 Simplified Deployment for Local Network

### Option 1: Docker Compose (Recommended)

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./api
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:///fridgeplan.db
      - ALLOWED_ORIGINS=http://192.168.0.122:3000
    volumes:
      - ./api/fridgeplan.db:/app/fridgeplan.db

  frontend:
    build: ./web
    ports:
      - "3000:80"
    environment:
      - VITE_API_URL=http://192.168.0.122:8000
      - VITE_WS_URL=ws://192.168.0.122:8000/ws
```

**Start**:
```bash
docker-compose up -d
```

**Access from any device**:
- Backend: `http://192.168.0.122:8000`
- Frontend: `http://192.168.0.122:3000`

### Option 2: PM2 Process Manager (Simpler)

```bash
# Install PM2 globally
npm install -g pm2

# Start backend
cd api
pm2 start "uvicorn main:app --host 0.0.0.0 --port 8000" --name fridgeplan-api

# Build and serve frontend
cd ../web
npm run build
pm2 serve dist 3000 --name fridgeplan-web

# Save PM2 config for auto-restart on boot
pm2 save
pm2 startup
```

### Option 3: Simple Python + Node (Currently Running)

**What's running now**:
- Backend: `http://localhost:8000` (uvicorn)
- Frontend: `http://localhost:5173` (Vite dev server)

**To access from tablets on same network**:
- Find your PC's local IP: `ipconfig` (look for 192.168.x.x)
- Backend: `http://192.168.0.122:8000`
- Frontend: `http://192.168.0.122:5173`

**To keep running permanently**:
```bash
# Backend (in one terminal)
cd api
uv run uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend (in another terminal)
cd web
npm run dev -- --host
```

---

## 📊 Feature Priority for Tri-Screen Integration

### Must-Have (Complete this weekend)
1. ✅ Device detection hook
2. ✅ Query parameter routing
3. ✅ Grocery-only view for left tablet
4. ✅ Timer component for right tablet
5. ✅ Large touch targets (60px) for tablets
6. ✅ WebSocket timer synchronization

### Nice-to-Have (Next week)
7. Macro nutrition chart (Chart.js)
8. Pantry expiration tracker
9. Family notes board
10. Physical simulator page
11. Fridge temperature display
12. Auto-brightness based on time of day

### Future Enhancements
13. Recipe library with cooking instructions
14. Voice commands (Alexa/Google Home integration)
15. Barcode scanner for pantry items
16. Meal photo capture
17. Historical meal analytics

---

## 🧪 Testing Plan

### Test on Gateway Monitor (Center)
- [ ] Load `http://192.168.0.122:5173/?device=gateway`
- [ ] Verify full dashboard shows (meal grid + tabs)
- [ ] Edit meal cells and verify sync
- [ ] Switch languages (EN/ES)
- [ ] Check WebSocket connection (green "Live" indicator)

### Test on Fire Tablet (Left)
- [ ] Load `http://192.168.0.122:5173/?device=tablet&view=grocery`
- [ ] Verify only grocery list shows
- [ ] Add item, toggle bought status
- [ ] Verify changes sync to Gateway view
- [ ] Test "Refresh from Plan" button
- [ ] Test "Clear Bought" button

### Test on Samsung Tab (Right)
- [ ] Load `http://192.168.0.122:5173/?device=tablet&view=timer`
- [ ] Verify only timer view shows
- [ ] Create new timer
- [ ] Start/pause timer
- [ ] Verify timer countdown updates every second
- [ ] Verify timer state syncs to other devices

### Test Multi-Device Sync
- [ ] Edit meal on Gateway → appears on Fire tablet grocery list
- [ ] Start timer on Samsung → countdown visible on Gateway
- [ ] Check grocery item on Fire → updates on Gateway
- [ ] Disconnect/reconnect network → state persists

---

## 💡 Your Mockup Analysis

**What I loved about your tri-screen HTML mockup**:
1. ✅ **Physical Simulator** - Brilliant visual representation of hardware layout
2. ✅ **Device-Specific Roles** - Clear separation of concerns (grocery/main/timers)
3. ✅ **Macro Balance Radar Chart** - Professional nutrition visualization
4. ✅ **Live Preview Windows** - Simulated screen feeds show real-time sync
5. ✅ **Pantry Inventory Bars** - Visual expiration tracking
6. ✅ **Family Notes Board** - Shared communication space
7. ✅ **Fridge Telemetry** - Temperature monitoring

**What we'll adapt for FridgePlan**:
- Device detection and responsive layouts ✅
- Specialized views per screen ✅
- Timer synchronization ✅
- Grocery-focused left tablet ✅
- Keep existing real-time sync ✅
- Add macro chart visualization 🔜
- Add pantry tracker 🔜
- Add family notes 🔜

---

## 🎯 Next Steps

1. **Right Now**: Test the local servers running:
   - Open browser: `http://localhost:5173`
   - Test meal editing, grocery list, language switcher
   - Verify WebSocket shows green "Live"

2. **This Session**: I'll implement:
   - Device detection
   - Query parameter routing
   - Timer component
   - Grocery-only view
   - Large touch targets

3. **After Testing**: Deploy to your local network:
   - Find your PC IP: `ipconfig`
   - Access from tablets: `http://YOUR_IP:5173`
   - Configure Fully Kiosk Browser
   - Mount to refrigerator!

4. **Weekend Project**: Add enhancements:
   - Macro chart
   - Pantry tracker
   - Physical simulator page
   - Family notes

---

**Ready to test?** Open `http://localhost:5173` in your browser and try:
1. Editing a meal cell
2. Clicking "Groceries" tab
3. Adding a grocery item
4. Switching language to Spanish (ES button)
5. Toggling sync mode (click green "Live" pill)

Let me know what you see and we'll refine the tri-screen integration!

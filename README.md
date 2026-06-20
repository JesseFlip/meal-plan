# 🥗 Meal Plan — Weekly Nutrition Planner

**Live Demo:** [mealp.netlify.app](https://mealp.netlify.app)

A full-stack, real-time meal planning web app built for households who want to eat intentionally. Plan your week, auto-generate grocery lists, track your ingredient bank, and let AI suggest balanced meals — all synced live across devices.

---

## ✨ Features

### 📅 Weekly Meal Planner
- 7-day grid view (Breakfast · Lunch · Dinner) with intuitive inline editing
- Click any cell to edit — choose ingredients from dropdowns categorized by Protein, Veggie, Carb, and Fat
- **Simple** mode (structured macronutrient slots) and **Detailed** free-text mode
- One-click "Copy to Tomorrow" to carry forward a meal
- Rate each meal as ✅ Good or ❌ Bad — a per-day happiness score is auto-calculated from ratings
- Navigate between weeks with Previous/Next/Today controls or a date picker
- "With Friends" and "Cheat Meal" free-form slots for flexible days

### 🛒 Grocery List
- Auto-generates a shopping list from the week's meal plan via "Refresh from Plan"
- Manually add items with a category dropdown (Costco, Whole Foods, Trader Joe's, Target, and more)
- Mark items as bought and clear them with "Clear Bought"

### 🧺 Ingredient Bank
- Manage a personal library of available ingredients across four macronutrient categories: **Proteins**, **Veggies**, **Carbs**, **Fats**
- Add and remove ingredients — changes propagate to all meal cell dropdowns instantly
- Load pre-built templates (e.g., *Nutrition Framework 2.0*) for a quick-start ingredient set
- Includes 48 default ingredients across all four macro categories

### 🤖 AI Meal Generation
- "Generate Meals with AI" button auto-populates the weekly plan from your available ingredients
- Respects the principle of lean protein + leafy greens + low-starch carbs
- Bilingual generation support (English and Spanish)

### 🔗 Sharing
- Share your weekly plan via the native Web Share API — send a link that displays a read-only view of your current week

### 🌐 Multilingual
- Full EN / ES (English / Spanish) UI translation — switch with a single button click
- All UI strings, meal generator prompts, and labels are localized

### 🎨 Personalization
- **Dark mode** — persisted per household in the backend
- **Handwriting font** (Caveat) with a custom text color picker — makes the planner feel like a real notepad
- Clean, minimal design with Inter + Caveat (Google Fonts)

### 📱 Progressive Web App (PWA)
- Installable on iOS and Android as a standalone app
- Service worker with Workbox for offline caching
- Mobile-optimized layout with viewport-fit=cover and a native-feel status bar

### 🔄 Real-Time Sync
- Changes sync live across devices via a WebSocket connection
- Household-level data isolation — each household gets a unique UUID persisted in localStorage

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite |
| **Styling** | Custom CSS (component-scoped), Google Fonts (Inter, Caveat) |
| **State / Data** | Fetch API + WebSocket for real-time sync |
| **Backend** | FastAPI (Python) |
| **Database** | PostgreSQL |
| **Deployment** | Netlify (frontend + serverless API proxy) |
| **PWA** | Workbox (via `vite-plugin-pwa`) |
| **i18n** | Custom translation key system (EN / ES) |
| **AI** | AI meal generation endpoint |

---

## 🗂️ API Overview

The app communicates with a REST + WebSocket backend:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/household/init` | Create or retrieve a household by UUID |
| `GET` | `/api/household/settings` | Fetch household preferences (language, dark mode, meal slots) |
| `PATCH` | `/api/household/settings` | Update preferences |
| `GET` | `/api/plan?week=YYYY-MM-DD` | Fetch the meal plan for a given week |
| `PATCH` | `/api/plan/:id` | Update a single meal cell |
| `GET/POST/DELETE` | `/api/proteins` `/api/veggies` `/api/carbs` `/api/fats` | CRUD for the ingredient bank |
| `POST` | `/api/share` | Generate a shareable link for the current week |
| `GET` | `/api/shared/:token` | Retrieve a shared read-only plan |
| `WS` | `/ws` | Real-time sync across household devices |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL

### Frontend

```bash
git clone https://github.com/your-username/meal-plan.git
cd meal-plan/frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set up your environment variables
cp .env.example .env
# Fill in DATABASE_URL and any AI API keys

uvicorn main:app --reload
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/mealplan
AI_API_KEY=your_api_key_here
```

---

## 📸 Screenshots

| Meal Plan Grid | Edit Cell | Groceries | Ingredient Bank |
|---|---|---|---|
| 7-day planner with macro breakdown per meal | Inline dropdown editor with Simple/Detailed modes | Auto-generated shopping list by store | Categorized ingredient library with templates |

---

## 🔑 Key Engineering Highlights

- **Real-time multi-device sync** using WebSockets — edits made on one device appear on another immediately without polling
- **Optimistic UI** — meal edits render instantly on the client before the server confirms, keeping the experience snappy
- **Household isolation** — anonymous, privacy-friendly onboarding: no account required; a UUID is generated on first visit and used as the household key
- **PWA-first** — fully installable, works offline (read), and feels native on mobile with standalone display mode
- **Macronutrient-aware data model** — each meal slot stores `protein`, `veggie`, `carb_or_fat`, `text`, `person`, and `state` fields, enabling structured nutrition tracking alongside flexible free-text entries
- **Bilingual from the ground up** — all UI strings are translation-keyed in both English and Spanish, with the language preference persisted server-side per household
- **Templating system** — ingredient bank supports pre-built templates so households can bootstrap a full ingredient list in one click

---

## 📄 License

MIT

---

*Built with ❤️ for households who take nutrition seriously.*

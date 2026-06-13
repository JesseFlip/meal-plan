"""
FridgePlan backend — Phase 0 Spike

Single-file FastAPI app:
  - SQLite via SQLModel
  - REST: GET /api/plan, PUT /api/plan/{id}
  - WebSocket: /ws  (broadcasts slot.updated to all connected clients)
  - Auto-seeds with Dorys's whiteboard plan on first run

Run:
    cd api && pip install -r requirements.txt
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import os
import uuid
import json
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional, List

from fastapi import (
    FastAPI,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    Request,
    Header,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import google.generativeai as genai
from sqlmodel import Field, Session, SQLModel, create_engine, select
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


# ---------- Models ----------


class Household(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str = "My Household"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class HouseholdSettings(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    household_id: str = Field(foreign_key="household.id")
    num_meal_slots: int = 3  # 1-6 meals per day
    meal_slot_names: str = "Breakfast,Lunch,Dinner"  # Comma-separated
    first_day_of_week: int = 0  # 0=Monday, 6=Sunday
    plan_duration_days: int = 7  # 7, 10, or 14
    dietary_tags: str = ""  # Comma-separated: "vegetarian,gluten-free"
    language: str = "en"  # "en" or "es"
    handwriting_color: str = "#000000"  # Hex color for handwritten text
    night_mode: bool = False  # Dark mode toggle


class MealSlot(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    household_id: str = Field(foreign_key="household.id", index=True)
    day: int  # 0=Mon ... 6=Sun
    slot: int  # 0=Breakfast, 1=Lunch, 2=Dinner
    text: str = ""  # Legacy field, kept for backwards compatibility
    protein: str = ""  # Selected protein
    veggie: str = ""  # Selected green leafy veggie
    carb_or_fat: str = ""  # Carb for breakfast/lunch, fat for dinner
    person: Optional[str] = None  # None=both, "jesse", "dorys"
    state: str = "planned"  # planned | fasting | skipped | eaten
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class GroceryItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    household_id: str = Field(foreign_key="household.id", index=True)
    name: str
    category: str  # Produce, Protein, Dairy, Pantry, Other
    store: str = "Other"  # Costco, Central Market, Trader Joes, Tom Thumb, Whole Foods, Target, La Michocana, Other
    bought: bool = False
    is_derived: bool = False  # True if auto-extracted from meal plan
    source_meal_id: Optional[int] = None  # Link to MealSlot if derived
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MealHistory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    household_id: str = Field(foreign_key="household.id", index=True)
    meal_name: str = Field(index=True)  # Unique meal name
    use_count: int = 0  # How many times this meal was used
    last_used: datetime = Field(default_factory=datetime.utcnow)


class DayCompliance(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    household_id: str = Field(foreign_key="household.id", index=True)
    day: int = Field(index=True)  # 0=Mon ... 6=Sun
    compliant: bool = False  # Whether they ate according to plan
    notes: str = ""  # Optional notes about the day
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ProteinOption(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    household_id: str = Field(foreign_key="household.id", index=True)
    name: str = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class VeggieOption(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    household_id: str = Field(foreign_key="household.id", index=True)
    name: str = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CarbOption(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    household_id: str = Field(foreign_key="household.id", index=True)
    name: str = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class FatOption(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    household_id: str = Field(foreign_key="household.id", index=True)
    name: str = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


def slot_to_dict(s: MealSlot) -> dict:
    return {
        "id": s.id,
        "household_id": s.household_id,
        "day": s.day,
        "slot": s.slot,
        "text": s.text,
        "protein": s.protein,
        "veggie": s.veggie,
        "carb_or_fat": s.carb_or_fat,
        "person": s.person,
        "state": s.state,
        "updated_at": s.updated_at.isoformat(),
    }


def grocery_to_dict(g: GroceryItem) -> dict:
    return {
        "id": g.id,
        "household_id": g.household_id,
        "name": g.name,
        "category": g.category,
        "store": g.store,
        "bought": g.bought,
        "is_derived": g.is_derived,
        "source_meal_id": g.source_meal_id,
    }


def household_to_dict(h: Household) -> dict:
    return {
        "id": h.id,
        "name": h.name,
        "created_at": h.created_at.isoformat(),
    }


def settings_to_dict(s: HouseholdSettings) -> dict:
    return {
        "id": s.id,
        "household_id": s.household_id,
        "num_meal_slots": s.num_meal_slots,
        "meal_slot_names": s.meal_slot_names.split(","),
        "first_day_of_week": s.first_day_of_week,
        "plan_duration_days": s.plan_duration_days,
        "dietary_tags": s.dietary_tags.split(",") if s.dietary_tags else [],
        "language": s.language,
        "handwriting_color": s.handwriting_color,
        "night_mode": s.night_mode,
    }


# ---------- DB ----------

db_url = os.getenv("DATABASE_URL", "sqlite:///fridgeplan.db")
# Railway/Heroku-style URLs may use the deprecated postgres:// scheme,
# which SQLAlchemy 2.x rejects.
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    db_url,
    connect_args=({"check_same_thread": False} if db_url.startswith("sqlite") else {}),
    # Recycle stale connections — managed Postgres drops idle ones.
    pool_pre_ping=True,
)


# Seed data from Dorys's actual whiteboard photo (May 2026)
SEED_PLAN = [
    # (day, slot, text, person, state)
    (0, 0, "egg bites", None, "planned"),  # Mon breakfast
    (1, 0, "egg tacos", None, "planned"),  # Tue breakfast
    (1, 1, "leftover / sandwich", None, "planned"),  # Tue lunch (split)
    (1, 2, "Fish + green beans", None, "planned"),  # Tue dinner
    (2, 0, "yogurt + coffee", None, "planned"),  # Wed breakfast
    (2, 1, "salad / ground beef", None, "planned"),  # Wed lunch
    (3, 0, "egg bites", None, "planned"),  # Thu breakfast
    (3, 1, "sandwich", None, "planned"),  # Thu lunch
    (4, 0, "boiled eggs", None, "planned"),  # Fri breakfast
    (4, 1, "chicken salad", None, "planned"),  # Fri lunch
    (5, 0, "Fasting", None, "fasting"),  # Sat breakfast
    (6, 2, "Shrimp salad", None, "planned"),  # Sun dinner
]


def seed_if_empty():
    """Initialize database with default household and seed data."""
    with Session(engine) as session:
        # Check if any households exist
        existing_household = session.exec(select(Household)).first()
        if existing_household:
            return  # Already seeded

        # Create default household
        default_household = Household(name="My Household")
        session.add(default_household)
        session.commit()
        session.refresh(default_household)

        # Create default settings
        settings = HouseholdSettings(
            household_id=default_household.id,
            num_meal_slots=3,
            meal_slot_names="Breakfast,Lunch,Dinner",
            first_day_of_week=0,
            plan_duration_days=7,
            dietary_tags="",
            language="en",
        )
        session.add(settings)

        # Create meal slots
        filled = {(d, s): (t, p, st) for d, s, t, p, st in SEED_PLAN}
        for day in range(7):
            for slot in range(3):
                text, person, state = filled.get((day, slot), ("", None, "planned"))
                session.add(
                    MealSlot(
                        household_id=default_household.id,
                        day=day,
                        slot=slot,
                        text=text,
                        person=person,
                        state=state,
                    )
                )

        session.commit()


# ---------- Grocery Smart Parsing ----------

# Ingredient categorization map (English and Spanish)
INGREDIENT_CATEGORIES = {
    # Produce
    "lettuce": "Produce",
    "lechuga": "Produce",
    "tomato": "Produce",
    "tomate": "Produce",
    "onion": "Produce",
    "cebolla": "Produce",
    "bell pepper": "Produce",
    "pimiento": "Produce",
    "cucumber": "Produce",
    "pepino": "Produce",
    "carrot": "Produce",
    "zanahoria": "Produce",
    "spinach": "Produce",
    "espinaca": "Produce",
    "broccoli": "Produce",
    "brócoli": "Produce",
    "green beans": "Produce",
    "ejotes": "Produce",
    "avocado": "Produce",
    "aguacate": "Produce",
    "cilantro": "Produce",
    "lime": "Produce",
    "limón": "Produce",
    "lemon": "Produce",
    "garlic": "Produce",
    "ajo": "Produce",
    # Protein
    "chicken": "Protein",
    "pollo": "Protein",
    "beef": "Protein",
    "carne": "Protein",
    "pork": "Protein",
    "cerdo": "Protein",
    "fish": "Protein",
    "pescado": "Protein",
    "shrimp": "Protein",
    "camarón": "Protein",
    "salmon": "Protein",
    "salmón": "Protein",
    "tuna": "Protein",
    "atún": "Protein",
    "turkey": "Protein",
    "pavo": "Protein",
    "eggs": "Protein",
    "huevos": "Protein",
    "egg": "Protein",
    "huevo": "Protein",
    "tofu": "Protein",
    "ground beef": "Protein",
    "carne molida": "Protein",
    # Dairy
    "milk": "Dairy",
    "leche": "Dairy",
    "cheese": "Dairy",
    "queso": "Dairy",
    "yogurt": "Dairy",
    "butter": "Dairy",
    "mantequilla": "Dairy",
    "cream": "Dairy",
    "crema": "Dairy",
    "sour cream": "Dairy",
    # Pantry
    "rice": "Pantry",
    "arroz": "Pantry",
    "beans": "Pantry",
    "frijoles": "Pantry",
    "pasta": "Pantry",
    "bread": "Pantry",
    "pan": "Pantry",
    "tortilla": "Pantry",
    "oil": "Pantry",
    "aceite": "Pantry",
    "olive oil": "Pantry",
    "salt": "Pantry",
    "sal": "Pantry",
    "pepper": "Pantry",
    "pimienta": "Pantry",
    "sugar": "Pantry",
    "azúcar": "Pantry",
    "flour": "Pantry",
    "harina": "Pantry",
    "oats": "Pantry",
    "avena": "Pantry",
    "coffee": "Pantry",
    "café": "Pantry",
    "sandwich": "Pantry",
}

# Meal-to-ingredients map (common meals and their components)
MEAL_INGREDIENTS = {
    "chicken salad": ["chicken", "lettuce", "tomato"],
    "ensalada de pollo": ["pollo", "lechuga", "tomate"],
    "fish + green beans": ["fish", "green beans"],
    "pescado + ejotes": ["pescado", "ejotes"],
    "egg bites": ["eggs"],
    "egg tacos": ["eggs", "tortilla"],
    "tacos de huevo": ["huevos", "tortilla"],
    "shrimp salad": ["shrimp", "lettuce"],
    "ensalada de camarón": ["camarón", "lechuga"],
    "yogurt + coffee": ["yogurt", "coffee"],
    "boiled eggs": ["eggs"],
    "huevos cocidos": ["huevos"],
}


def extract_ingredients_from_meal(meal_text: str) -> List[str]:
    """
    Extract ingredients from a meal description.
    First checks MEAL_INGREDIENTS map, then falls back to keyword search.
    """
    if not meal_text or meal_text.lower() in ("fasting", ""):
        return []

    meal_lower = meal_text.lower().strip()

    # Check exact match in meal map
    if meal_lower in MEAL_INGREDIENTS:
        return MEAL_INGREDIENTS[meal_lower]

    # Fallback: search for ingredient keywords in the text
    found = []
    for ingredient in INGREDIENT_CATEGORIES.keys():
        if ingredient in meal_lower:
            found.append(ingredient)

    return list(set(found))  # dedupe


def categorize_ingredient(ingredient: str) -> str:
    """Return category for an ingredient, defaulting to 'Other'."""
    return INGREDIENT_CATEGORIES.get(ingredient.lower(), "Other")


# ---------- WebSocket Manager ----------


class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, message: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()


# ---------- App ----------


@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    seed_if_empty()
    yield


app = FastAPI(title="FridgePlan API", lifespan=lifespan)

# CORS configuration — can be tightened via ALLOWED_ORIGINS env var
# Default includes production Netlify URL to ensure CORS works in production
allowed_origins_str = os.getenv(
    "ALLOWED_ORIGINS",
    "https://mealp.netlify.app,http://localhost:5173,http://localhost:5174",
)
allowed_origins = allowed_origins_str.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization", "X-Household-ID"],
)


# Optional PIN authentication middleware
PIN_AUTH_ENABLED = os.getenv("PIN_AUTH_ENABLED", "false").lower() == "true"
PIN_SECRET = os.getenv("PIN_SECRET", "")


@app.middleware("http")
async def pin_auth_middleware(request: Request, call_next):
    """
    Simple PIN authentication middleware.
    Enable by setting PIN_AUTH_ENABLED=true and PIN_SECRET=your_6_digit_pin
    """
    # Skip auth for health check and household initialization
    if request.url.path in ["/api/health", "/api/household/init"]:
        return await call_next(request)

    if PIN_AUTH_ENABLED and PIN_SECRET:
        pin_header = request.headers.get("X-FridgePlan-PIN", "")
        if pin_header != PIN_SECRET:
            return JSONResponse(
                status_code=401,
                content={"error": "Unauthorized: Invalid PIN"},
            )

    return await call_next(request)


# ---------- Household Helpers ----------


def get_household_id(x_household_id: Optional[str] = Header(None)) -> str:
    """
    Extract household_id from X-Household-ID header.
    If not provided, return the first household (backwards compatibility).
    """
    if x_household_id:
        return x_household_id

    # Fallback: return first household for backwards compatibility
    with Session(engine) as session:
        household = session.exec(select(Household)).first()
        if household:
            return household.id

    # No households exist - should not happen if seed runs
    raise HTTPException(400, "No household found. Initialize household first.")


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "ts": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "deployment": "automated",
    }


# ---------- Household Management Endpoints ----------


@app.post("/api/household/init")
def initialize_household(payload: dict):
    """
    Create a new household. Returns household_id for client to store.
    """
    name = payload.get("name", "My Household")

    with Session(engine) as session:
        household = Household(name=name)
        session.add(household)
        session.commit()
        session.refresh(household)

        # Create default settings
        settings = HouseholdSettings(
            household_id=household.id,
            num_meal_slots=3,
            meal_slot_names="Breakfast,Lunch,Dinner",
            first_day_of_week=0,
            plan_duration_days=7,
            dietary_tags="",
            language="en",
        )
        session.add(settings)

        # Create empty meal plan
        for day in range(7):
            for slot in range(3):
                session.add(
                    MealSlot(
                        household_id=household.id,
                        day=day,
                        slot=slot,
                        text="",
                        person=None,
                        state="planned",
                    )
                )

        session.commit()
        return household_to_dict(household)


@app.get("/api/household/settings")
def get_household_settings(household_id: str = Header(None, alias="X-Household-ID")):
    """Get household settings."""
    hh_id = get_household_id(household_id)

    with Session(engine) as session:
        settings = session.exec(
            select(HouseholdSettings).where(HouseholdSettings.household_id == hh_id)
        ).first()

        if not settings:
            raise HTTPException(404, "Settings not found")

        return settings_to_dict(settings)


@app.put("/api/household/settings")
def update_household_settings(
    payload: dict, household_id: str = Header(None, alias="X-Household-ID")
):
    """Update household settings."""
    hh_id = get_household_id(household_id)

    with Session(engine) as session:
        settings = session.exec(
            select(HouseholdSettings).where(HouseholdSettings.household_id == hh_id)
        ).first()

        if not settings:
            raise HTTPException(404, "Settings not found")

        # Update fields
        if "num_meal_slots" in payload:
            settings.num_meal_slots = payload["num_meal_slots"]
        if "meal_slot_names" in payload:
            settings.meal_slot_names = ",".join(payload["meal_slot_names"])
        if "first_day_of_week" in payload:
            settings.first_day_of_week = payload["first_day_of_week"]
        if "plan_duration_days" in payload:
            settings.plan_duration_days = payload["plan_duration_days"]
        if "dietary_tags" in payload:
            settings.dietary_tags = ",".join(payload["dietary_tags"])
        if "language" in payload:
            settings.language = payload["language"]
        if "handwriting_color" in payload:
            settings.handwriting_color = payload["handwriting_color"]
        if "night_mode" in payload:
            settings.night_mode = payload["night_mode"]

        session.add(settings)
        session.commit()
        session.refresh(settings)

        return settings_to_dict(settings)


@app.get("/api/plan")
def get_plan(household_id: str = Header(None, alias="X-Household-ID")):
    """Get all meal slots for a household."""
    hh_id = get_household_id(household_id)

    with Session(engine) as session:
        slots = session.exec(
            select(MealSlot)
            .where(MealSlot.household_id == hh_id)
            .order_by(MealSlot.day, MealSlot.slot)
        ).all()
        return [slot_to_dict(s) for s in slots]


@app.put("/api/plan/{slot_id}")
async def update_slot(
    slot_id: int,
    payload: dict,
    household_id: str = Header(None, alias="X-Household-ID"),
):
    """Update a meal slot."""
    hh_id = get_household_id(household_id)

    with Session(engine) as session:
        slot = session.get(MealSlot, slot_id)
        if not slot or slot.household_id != hh_id:
            raise HTTPException(404, "Slot not found")

        for key in ("text", "person", "state", "protein", "veggie", "carb_or_fat"):
            if key in payload:
                setattr(slot, key, payload[key])
        slot.updated_at = datetime.utcnow()

        # Track meal history when text is updated
        if "text" in payload and payload["text"].strip():
            meal_name = payload["text"].strip()
            # Don't track "fasting" or empty meals
            if meal_name.lower() not in ("fasting", ""):
                history = session.exec(
                    select(MealHistory).where(
                        MealHistory.household_id == hh_id,
                        MealHistory.meal_name == meal_name,
                    )
                ).first()

                if history:
                    history.use_count += 1
                    history.last_used = datetime.utcnow()
                else:
                    history = MealHistory(
                        household_id=hh_id,
                        meal_name=meal_name,
                        use_count=1,
                        last_used=datetime.utcnow(),
                    )
                session.add(history)

        session.add(slot)
        session.commit()
        session.refresh(slot)
        data = slot_to_dict(slot)
        await manager.broadcast(
            {"type": "slot.updated", "data": data, "household_id": hh_id}
        )
        return data


@app.get("/api/meals/history")
def get_meal_history(household_id: str = Header(None, alias="X-Household-ID")):
    """Get meal history for autocomplete, ordered by usage frequency and recency."""
    hh_id = get_household_id(household_id)

    with Session(engine) as session:
        # Get all meal history, ordered by use_count desc, then last_used desc
        history = session.exec(
            select(MealHistory)
            .where(MealHistory.household_id == hh_id)
            .order_by(MealHistory.use_count.desc(), MealHistory.last_used.desc())
            .limit(50)  # Limit to top 50 most used meals
        ).all()

        return [{"meal_name": h.meal_name, "use_count": h.use_count} for h in history]


@app.get("/api/compliance")
def get_compliance(household_id: str = Header(None, alias="X-Household-ID")):
    """Get compliance status for all days of the week."""
    hh_id = get_household_id(household_id)

    with Session(engine) as session:
        compliance_records = session.exec(
            select(DayCompliance).where(DayCompliance.household_id == hh_id)
        ).all()

        # Return compliance for all 7 days (0=Mon...6=Sun)
        compliance_map = {c.day: c.compliant for c in compliance_records}
        return [
            {"day": day, "compliant": compliance_map.get(day, False)}
            for day in range(7)
        ]


@app.post("/api/compliance/{day}")
def toggle_compliance(
    day: int, payload: dict, household_id: str = Header(None, alias="X-Household-ID")
):
    """Toggle compliance status for a specific day."""
    hh_id = get_household_id(household_id)

    if day < 0 or day > 6:
        raise HTTPException(400, "Day must be between 0 and 6")

    with Session(engine) as session:
        compliance = session.exec(
            select(DayCompliance).where(
                DayCompliance.household_id == hh_id, DayCompliance.day == day
            )
        ).first()

        compliant = payload.get("compliant", False)

        if compliance:
            compliance.compliant = compliant
            compliance.updated_at = datetime.utcnow()
        else:
            compliance = DayCompliance(
                household_id=hh_id,
                day=day,
                compliant=compliant,
                updated_at=datetime.utcnow(),
            )

        session.add(compliance)
        session.commit()
        session.refresh(compliance)

        return {"day": compliance.day, "compliant": compliance.compliant}


@app.post("/api/reset")
async def reset_plan(household_id: str = Header(None, alias="X-Household-ID")):
    """Clear all meal slots for a household."""
    hh_id = get_household_id(household_id)

    with Session(engine) as session:
        slots = session.exec(
            select(MealSlot).where(MealSlot.household_id == hh_id)
        ).all()
        for slot in slots:
            slot.text = ""
            slot.person = None
            slot.state = "planned"
            session.add(slot)
        session.commit()

    await manager.broadcast({"type": "plan.reset", "household_id": hh_id})
    return {"ok": True}


# ---------- Grocery List Endpoints ----------


@app.get("/api/groceries")
def get_groceries(household_id: str = Header(None, alias="X-Household-ID")):
    """Return all grocery items for a household, ordered by category then name."""
    hh_id = get_household_id(household_id)

    with Session(engine) as session:
        items = session.exec(
            select(GroceryItem)
            .where(GroceryItem.household_id == hh_id)
            .order_by(GroceryItem.category, GroceryItem.name)
        ).all()
        return [grocery_to_dict(g) for g in items]


@app.post("/api/groceries")
def add_grocery(
    payload: dict, household_id: str = Header(None, alias="X-Household-ID")
):
    """Manually add a grocery item."""
    hh_id = get_household_id(household_id)
    name = payload.get("name", "").strip()
    if not name:
        raise HTTPException(400, "Item name required")

    category = categorize_ingredient(name)
    store = payload.get("store", "Other")  # Default to "Other" if not specified

    with Session(engine) as session:
        item = GroceryItem(
            household_id=hh_id,
            name=name,
            category=category,
            store=store,
            bought=False,
            is_derived=False,
            source_meal_id=None,
        )
        session.add(item)
        session.commit()
        session.refresh(item)
        return grocery_to_dict(item)


@app.patch("/api/groceries/{item_id}")
def toggle_grocery(
    item_id: int,
    payload: dict,
    household_id: str = Header(None, alias="X-Household-ID"),
):
    """Toggle bought status of a grocery item."""
    hh_id = get_household_id(household_id)

    with Session(engine) as session:
        item = session.get(GroceryItem, item_id)
        if not item or item.household_id != hh_id:
            raise HTTPException(404, "Item not found")

        if "bought" in payload:
            item.bought = payload["bought"]

        session.add(item)
        session.commit()
        session.refresh(item)
        return grocery_to_dict(item)


@app.post("/api/groceries/clear")
def clear_bought_groceries(household_id: str = Header(None, alias="X-Household-ID")):
    """Delete all items marked as bought for a household."""
    hh_id = get_household_id(household_id)

    with Session(engine) as session:
        bought_items = session.exec(
            select(GroceryItem)
            .where(GroceryItem.household_id == hh_id)
            .where(GroceryItem.bought)
        ).all()
        for item in bought_items:
            session.delete(item)
        session.commit()
        return {"ok": True, "deleted": len(bought_items)}


@app.post("/api/groceries/sync")
def sync_groceries_from_plan(household_id: str = Header(None, alias="X-Household-ID")):
    """
    Extract ingredients from all meal slots and add missing ones to grocery list.
    Only adds items not already in the list (by name).
    Respects dietary restrictions from household settings.
    """
    hh_id = get_household_id(household_id)

    with Session(engine) as session:
        # Get household settings for dietary restrictions
        settings = session.exec(
            select(HouseholdSettings).where(HouseholdSettings.household_id == hh_id)
        ).first()
        dietary_tags = (
            settings.dietary_tags.split(",")
            if settings and settings.dietary_tags
            else []
        )

        # Get all meal slots for this household
        slots = session.exec(
            select(MealSlot).where(MealSlot.household_id == hh_id)
        ).all()

        # Extract all ingredients
        all_ingredients = []
        for slot in slots:
            if slot.text and slot.state == "planned":
                ingredients = extract_ingredients_from_meal(slot.text)
                for ing in ingredients:
                    # Filter based on dietary restrictions
                    if should_include_ingredient(ing, dietary_tags):
                        all_ingredients.append((ing, slot.id))

        # Get existing grocery item names
        existing = session.exec(
            select(GroceryItem).where(GroceryItem.household_id == hh_id)
        ).all()
        existing_names = {item.name.lower() for item in existing}

        # Add new ingredients
        added = 0
        for ingredient, meal_id in all_ingredients:
            if ingredient.lower() not in existing_names:
                category = categorize_ingredient(ingredient)
                item = GroceryItem(
                    household_id=hh_id,
                    name=ingredient.capitalize(),
                    category=category,
                    bought=False,
                    is_derived=True,
                    source_meal_id=meal_id,
                )
                session.add(item)
                existing_names.add(ingredient.lower())
                added += 1

        session.commit()
        return {"ok": True, "added": added}


def should_include_ingredient(ingredient: str, dietary_tags: List[str]) -> bool:
    """
    Filter ingredients based on dietary restrictions.
    Returns False if ingredient conflicts with dietary tags.
    """
    ing_lower = ingredient.lower()

    # Vegetarian restrictions
    if "vegetarian" in dietary_tags:
        meat_keywords = [
            "chicken",
            "beef",
            "pork",
            "fish",
            "shrimp",
            "salmon",
            "tuna",
            "turkey",
            "pollo",
            "carne",
            "cerdo",
            "pescado",
            "camarón",
            "salmón",
            "atún",
            "pavo",
        ]
        if any(keyword in ing_lower for keyword in meat_keywords):
            return False

    # Gluten-free restrictions
    if "gluten-free" in dietary_tags:
        gluten_keywords = ["bread", "pasta", "flour", "tortilla", "pan", "harina"]
        if any(keyword in ing_lower for keyword in gluten_keywords):
            return False

    # Dairy-free restrictions
    if "dairy-free" in dietary_tags:
        dairy_keywords = [
            "milk",
            "cheese",
            "yogurt",
            "butter",
            "cream",
            "leche",
            "queso",
            "mantequilla",
            "crema",
        ]
        if any(keyword in ing_lower for keyword in dairy_keywords):
            return False

    return True


# ---------- Food Option Endpoints ----------


@app.get("/api/proteins")
def get_proteins(household_id: str = Header(None, alias="X-Household-ID")):
    """Get all protein options for a household."""
    hh_id = get_household_id(household_id)

    with Session(engine) as session:
        proteins = session.exec(
            select(ProteinOption)
            .where(ProteinOption.household_id == hh_id)
            .order_by(ProteinOption.name)
        ).all()
        return [{"id": p.id, "name": p.name} for p in proteins]


@app.post("/api/proteins")
def add_protein(
    payload: dict, household_id: str = Header(None, alias="X-Household-ID")
):
    """Add a new protein option."""
    hh_id = get_household_id(household_id)
    name = payload.get("name", "").strip()
    if not name:
        raise HTTPException(400, "Protein name required")

    with Session(engine) as session:
        # Check if already exists
        existing = session.exec(
            select(ProteinOption).where(
                ProteinOption.household_id == hh_id, ProteinOption.name == name
            )
        ).first()
        if existing:
            raise HTTPException(400, "Protein already exists")

        protein = ProteinOption(household_id=hh_id, name=name)
        session.add(protein)
        session.commit()
        session.refresh(protein)
        return {"id": protein.id, "name": protein.name}


@app.delete("/api/proteins/{protein_id}")
def delete_protein(
    protein_id: int, household_id: str = Header(None, alias="X-Household-ID")
):
    """Delete a protein option."""
    hh_id = get_household_id(household_id)

    with Session(engine) as session:
        protein = session.get(ProteinOption, protein_id)
        if not protein or protein.household_id != hh_id:
            raise HTTPException(404, "Protein not found")

        session.delete(protein)
        session.commit()
        return {"ok": True}


@app.get("/api/veggies")
def get_veggies(household_id: str = Header(None, alias="X-Household-ID")):
    """Get all veggie options for a household."""
    hh_id = get_household_id(household_id)

    with Session(engine) as session:
        veggies = session.exec(
            select(VeggieOption)
            .where(VeggieOption.household_id == hh_id)
            .order_by(VeggieOption.name)
        ).all()
        return [{"id": v.id, "name": v.name} for v in veggies]


@app.post("/api/veggies")
def add_veggie(payload: dict, household_id: str = Header(None, alias="X-Household-ID")):
    """Add a new veggie option."""
    hh_id = get_household_id(household_id)
    name = payload.get("name", "").strip()
    if not name:
        raise HTTPException(400, "Veggie name required")

    with Session(engine) as session:
        # Check if already exists
        existing = session.exec(
            select(VeggieOption).where(
                VeggieOption.household_id == hh_id, VeggieOption.name == name
            )
        ).first()
        if existing:
            raise HTTPException(400, "Veggie already exists")

        veggie = VeggieOption(household_id=hh_id, name=name)
        session.add(veggie)
        session.commit()
        session.refresh(veggie)
        return {"id": veggie.id, "name": veggie.name}


@app.delete("/api/veggies/{veggie_id}")
def delete_veggie(
    veggie_id: int, household_id: str = Header(None, alias="X-Household-ID")
):
    """Delete a veggie option."""
    hh_id = get_household_id(household_id)

    with Session(engine) as session:
        veggie = session.get(VeggieOption, veggie_id)
        if not veggie or veggie.household_id != hh_id:
            raise HTTPException(404, "Veggie not found")

        session.delete(veggie)
        session.commit()
        return {"ok": True}


@app.get("/api/carbs")
def get_carbs(household_id: str = Header(None, alias="X-Household-ID")):
    """Get all carb options for a household."""
    hh_id = get_household_id(household_id)

    with Session(engine) as session:
        carbs = session.exec(
            select(CarbOption)
            .where(CarbOption.household_id == hh_id)
            .order_by(CarbOption.name)
        ).all()
        return [{"id": c.id, "name": c.name} for c in carbs]


@app.post("/api/carbs")
def add_carb(payload: dict, household_id: str = Header(None, alias="X-Household-ID")):
    """Add a new carb option."""
    hh_id = get_household_id(household_id)
    name = payload.get("name", "").strip()
    if not name:
        raise HTTPException(400, "Carb name required")

    with Session(engine) as session:
        # Check if already exists
        existing = session.exec(
            select(CarbOption).where(
                CarbOption.household_id == hh_id, CarbOption.name == name
            )
        ).first()
        if existing:
            raise HTTPException(400, "Carb already exists")

        carb = CarbOption(household_id=hh_id, name=name)
        session.add(carb)
        session.commit()
        session.refresh(carb)
        return {"id": carb.id, "name": carb.name}


@app.delete("/api/carbs/{carb_id}")
def delete_carb(carb_id: int, household_id: str = Header(None, alias="X-Household-ID")):
    """Delete a carb option."""
    hh_id = get_household_id(household_id)

    with Session(engine) as session:
        carb = session.get(CarbOption, carb_id)
        if not carb or carb.household_id != hh_id:
            raise HTTPException(404, "Carb not found")

        session.delete(carb)
        session.commit()
        return {"ok": True}


@app.get("/api/fats")
def get_fats(household_id: str = Header(None, alias="X-Household-ID")):
    """Get all fat options for a household."""
    hh_id = get_household_id(household_id)

    with Session(engine) as session:
        fats = session.exec(
            select(FatOption)
            .where(FatOption.household_id == hh_id)
            .order_by(FatOption.name)
        ).all()
        return [{"id": f.id, "name": f.name} for f in fats]


@app.post("/api/fats")
def add_fat(payload: dict, household_id: str = Header(None, alias="X-Household-ID")):
    """Add a new fat option."""
    hh_id = get_household_id(household_id)
    name = payload.get("name", "").strip()
    if not name:
        raise HTTPException(400, "Fat name required")

    with Session(engine) as session:
        # Check if already exists
        existing = session.exec(
            select(FatOption).where(
                FatOption.household_id == hh_id, FatOption.name == name
            )
        ).first()
        if existing:
            raise HTTPException(400, "Fat already exists")

        fat = FatOption(household_id=hh_id, name=name)
        session.add(fat)
        session.commit()
        session.refresh(fat)
        return {"id": fat.id, "name": fat.name}


@app.delete("/api/fats/{fat_id}")
def delete_fat(fat_id: int, household_id: str = Header(None, alias="X-Household-ID")):
    """Delete a fat option."""
    hh_id = get_household_id(household_id)

    with Session(engine) as session:
        fat = session.get(FatOption, fat_id)
        if not fat or fat.household_id != hh_id:
            raise HTTPException(404, "Fat not found")

        session.delete(fat)
        session.commit()
        return {"ok": True}


@app.post("/api/meals/generate")
def generate_meals(
    payload: dict, household_id: str = Header(None, alias="X-Household-ID")
):
    """Generate AI-powered meal suggestions based on available food options."""
    hh_id = get_household_id(household_id)

    # Get parameters from payload
    num_meals = payload.get("num_meals", 7)
    dietary_preferences = payload.get("dietary_preferences", "")

    with Session(engine) as session:
        # Get all food options for the household
        proteins = list(
            session.exec(
                select(ProteinOption).where(ProteinOption.household_id == hh_id)
            )
        )
        veggies = list(
            session.exec(select(VeggieOption).where(VeggieOption.household_id == hh_id))
        )
        carbs = list(
            session.exec(select(CarbOption).where(CarbOption.household_id == hh_id))
        )
        fats = list(
            session.exec(select(FatOption).where(FatOption.household_id == hh_id))
        )

        # Format food options for the prompt
        proteins_list = (
            ", ".join([p.name for p in proteins]) if proteins else "chicken, fish, tofu"
        )
        veggies_list = (
            ", ".join([v.name for v in veggies])
            if veggies
            else "spinach, broccoli, kale"
        )
        carbs_list = (
            ", ".join([c.name for c in carbs])
            if carbs
            else "brown rice, quinoa, sweet potato"
        )
        fats_list = (
            ", ".join([f.name for f in fats]) if fats else "avocado, olive oil, nuts"
        )

        # Get API key from environment
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(500, "GEMINI_API_KEY not configured")

        # Build the prompt
        prompt = f"""Generate {num_meals} healthy meal suggestions using the following available ingredients:

Proteins: {proteins_list}
Vegetables (green leafy preferred): {veggies_list}
Carbs: {carbs_list}
Fats: {fats_list}

{f"Dietary preferences/restrictions: {dietary_preferences}" if dietary_preferences else ""}

Please follow these guidelines:
- For breakfast and lunch: Include lean protein + green leafy veggies + low-starch carb
- For dinner: Include lean protein + green leafy veggies + healthy fat
- Create variety across the meals
- Keep it simple and practical
- Each meal should be balanced and nutritious

Return ONLY a valid JSON array with this exact structure:
[
  {{
    "name": "Meal Name",
    "meal_type": "breakfast|lunch|dinner",
    "protein": "protein from the list",
    "veggie": "veggie from the list",
    "carb_or_fat": "carb or fat from the list",
    "description": "Brief 1-2 sentence description"
  }}
]

Make sure to use ONLY ingredients from the lists provided above."""

        try:
            # Call Gemini API
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-flash-latest")
            response = model.generate_content(prompt)
            response_text = response.text

            # Parse JSON from response
            # Try to find JSON array in the response
            start_idx = response_text.find("[")
            end_idx = response_text.rfind("]") + 1

            if start_idx == -1 or end_idx == 0:
                raise HTTPException(
                    500, "Failed to parse meal suggestions from AI response"
                )

            json_str = response_text[start_idx:end_idx]
            meals = json.loads(json_str)

            return {"meals": meals}

        except json.JSONDecodeError as e:
            raise HTTPException(500, f"Failed to parse AI response: {str(e)}")
        except Exception as e:
            raise HTTPException(500, f"Error generating meals: {str(e)}")


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        # Keep connection alive. We don't currently accept inbound messages.
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)


if __name__ == "__main__":
    # Nixpacks' Python provider starts the app with `python main.py` when no
    # explicit start command applies (e.g. Railway root directory set to api/,
    # where the repo-root railway.json and Procfile are not picked up). Without
    # this block that command imports the module and exits 0 — the deploy looks
    # green while nothing is listening.
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))

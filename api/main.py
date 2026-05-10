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
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional, List

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Field, Session, SQLModel, create_engine, select


# ---------- Models ----------

class MealSlot(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    day: int             # 0=Mon ... 6=Sun
    slot: int            # 0=Breakfast, 1=Lunch, 2=Dinner
    text: str = ""
    person: Optional[str] = None   # None=both, "jesse", "dorys"
    state: str = "planned"         # planned | fasting | skipped | eaten
    updated_at: datetime = Field(default_factory=datetime.utcnow)


def slot_to_dict(s: MealSlot) -> dict:
    return {
        "id": s.id,
        "day": s.day,
        "slot": s.slot,
        "text": s.text,
        "person": s.person,
        "state": s.state,
        "updated_at": s.updated_at.isoformat(),
    }


# ---------- DB ----------

engine = create_engine(
    os.getenv("DATABASE_URL", "sqlite:///fridgeplan.db"),
    connect_args=(
        {"check_same_thread": False}
        if os.getenv("DATABASE_URL", "sqlite://").startswith("sqlite")
        else {}
    ),
)


# Seed data from Dorys's actual whiteboard photo (May 2026)
SEED_PLAN = [
    # (day, slot, text, person, state)
    (0, 0, "egg bites", None, "planned"),                            # Mon breakfast
    (1, 0, "egg tacos", None, "planned"),                            # Tue breakfast
    (1, 1, "leftover / sandwich", None, "planned"),                  # Tue lunch (split)
    (1, 2, "Fish + green beans", None, "planned"),                   # Tue dinner
    (2, 0, "yogurt + coffee", None, "planned"),                      # Wed breakfast
    (2, 1, "salad / ground beef", None, "planned"),                  # Wed lunch
    (3, 0, "egg bites", None, "planned"),                            # Thu breakfast
    (3, 1, "sandwich", None, "planned"),                             # Thu lunch
    (4, 0, "boiled eggs", None, "planned"),                          # Fri breakfast
    (4, 1, "chicken salad", None, "planned"),                        # Fri lunch
    (5, 0, "Fasting", None, "fasting"),                              # Sat breakfast
    (6, 2, "Shrimp salad", None, "planned"),                         # Sun dinner
]


def seed_if_empty():
    with Session(engine) as session:
        existing = session.exec(select(MealSlot)).first()
        if existing:
            return
        filled = {(d, s): (t, p, st) for d, s, t, p, st in SEED_PLAN}
        for day in range(7):
            for slot in range(3):
                text, person, state = filled.get((day, slot), ("", None, "planned"))
                session.add(MealSlot(day=day, slot=slot, text=text, person=person, state=state))
        session.commit()


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

# Permissive CORS — fine for a Tailscale-private API. Tighten if you ever expose publicly.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"ok": True, "ts": datetime.utcnow().isoformat()}


@app.get("/api/plan")
def get_plan():
    with Session(engine) as session:
        slots = session.exec(select(MealSlot).order_by(MealSlot.day, MealSlot.slot)).all()
        return [slot_to_dict(s) for s in slots]


@app.put("/api/plan/{slot_id}")
async def update_slot(slot_id: int, payload: dict):
    with Session(engine) as session:
        slot = session.get(MealSlot, slot_id)
        if not slot:
            raise HTTPException(404, "Slot not found")
        for key in ("text", "person", "state"):
            if key in payload:
                setattr(slot, key, payload[key])
        slot.updated_at = datetime.utcnow()
        session.add(slot)
        session.commit()
        session.refresh(slot)
        data = slot_to_dict(slot)
        await manager.broadcast({"type": "slot.updated", "data": data})
        return data


@app.post("/api/reset")
async def reset_plan():
    """Nuke and re-seed. Useful while iterating."""
    with Session(engine) as session:
        for s in session.exec(select(MealSlot)).all():
            session.delete(s)
        session.commit()
    seed_if_empty()
    await manager.broadcast({"type": "plan.reset"})
    return {"ok": True}


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        # Keep connection alive. We don't currently accept inbound messages.
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)

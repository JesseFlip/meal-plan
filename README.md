# FridgePlan

A household meal-planning PWA that replaces a magnetic whiteboard on the refrigerator.

[![Build Status](https://github.com/JesseFlip/meal-plan/actions/workflows/ci.yml/badge.svg)](https://github.com/JesseFlip/meal-plan/actions)
[![Live Deploy](https://img.shields.io/badge/deploy-live-brightgreen)](https://mealp.netlify.app/)
[![License: TBD](https://img.shields.io/badge/license-TBD-lightgrey)](#)

FridgePlan is a real working product for a real two-person household (Jesse and his wife Dorys). It is not a SaaS product or a generic meal-planning app; it is a digital replacement for the tactile ritual of a physical whiteboard.

![FridgePlan Grid Interface](docs/screenshot.png)
<!-- Screenshot will be added in a follow-up PR -->

## What it does

FridgePlan replaces a traditional magnetic whiteboard with a digital 7×3 grid representing the days of the week and meal types (Breakfast, Lunch, Dinner). It preserves the simplicity of the original whiteboard while adding the power of digital synchronization.

The project is designed to bridge the gap between a stationary "always-on" fridge tablet and mobile devices. Dorys, the primary user, has used a red dry-erase marker for years; this app succeeds only if it feels as natural and frictionless as that marker while ensuring the plan is accessible from anywhere.

## Live demo

**View the live application: [https://mealp.netlify.app/](https://mealp.netlify.app/)**

Visitors to the demo can see the current week's meal plan in real time. You can tap any cell to edit the text or change the meal state. Because multi-device synchronization is the core feature of the product, any changes you make in the demo will be visible to other simultaneous visitors and are pre-seeded with real-world data from the owner's household.

## Architecture

```text
Phone PWA + Tablet PWA + Laptop
       │
       ▼
WebSocket (Live Sync) + REST (CRUD)
       │
       ▼
FastAPI Backend (Railway)
       │
       ▼
Postgres / SQLite + WebSocket Fanout
       │
       ▼
All Connected Clients
```

## Tech stack

This stack is intentionally fixed as part of the project's [Constitution](specs/constitution.md). Changes require a formal constitutional amendment.

- **Backend**: Python 3.12, FastAPI, SQLModel, SQLite (dev) / Postgres (prod)
- **Frontend**: Vite 5, React 18, TypeScript, Tailwind 3, `vite-plugin-pwa`
- **Real-time**: native WebSockets (no Socket.IO, no Pusher, no third-party SaaS)
- **Hosting**: Railway (backend), Netlify (frontend)
- **CI**: GitHub Actions
- **Auth**: none in MVP — relies on private deployment.

## Local development

### Prerequisites
- Python 3.12+
- Node.js 20+

### Setup

```bash
git clone https://github.com/JesseFlip/meal-plan.git
cd meal-plan/fridgeplan-v1/fridgeplan
```

### Backend
```bash
cd api
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Unix:
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd web
npm install
npm run dev -- --port 5173
```

By default, the backend runs on `http://localhost:8000` and the frontend on `http://localhost:5173`. The local SQLite database will automatically seed with real data on the first run.

## Project methodology

FridgePlan is built using **spec-driven development** through the Antigravity IDE. Every feature is specified and planned before a single line of code is written.

- **Workflows**: See the automated lifecycle in [.agents/workflows/](.agents/workflows/)
- **Governance**: Non-negotiable principles are encoded in [specs/constitution.md](specs/constitution.md)

This README and the detailed [spec history](specs/) together form a transparent log of the project's evolution.

## Roadmap

The full feature roadmap is maintained in [docs/PRD.md](docs/PRD.md).

- **Phase 1 (MVP)**: Weekly grid, manual/auto sync modes, grocery list view, and kiosk-mode polish.
- **Phase 2 (Handwriting)**: Digital ink layer for tactile XP-Pen input on the fridge tablet.
- **Phase 3 (Smart Features)**: Handwriting recognition, macro tracking, and meal photography.

## Contributing

FridgePlan is a private household project. While the codebase is open for inspection and learning, external contributions and Pull Requests are not currently accepted. 

Please refer to [specs/constitution.md](specs/constitution.md) and [AGENTS.md](AGENTS.md) to understand the strict rules and architectural constraints that govern this repository.

## Acknowledgments

- Built collaboratively by Jesse Flippen with assistance from Anthropic's Claude during architecture and scaffolding phases.
- Implemented through spec-driven development with Google's Antigravity IDE.

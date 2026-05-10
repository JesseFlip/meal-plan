# Project Context — FridgePlan

## Origin

Dorys (the owner's wife) has used a magnetic dry-erase whiteboard on the refrigerator for years to plan the week's meals. She writes meals in red marker, in a mix of English and Spanish shorthand, with many slots intentionally left blank. She does intermittent fasting on Saturdays (marked simply as "Fasting"). The two of them (Jesse + Dorys) sometimes have different lunches on the same day, noted inline like "Dorys leftover / Jesse sandwich".

The whiteboard works. The product question is not "is this needed?" — it's "can software be *enough better than a whiteboard* that Dorys voluntarily switches?"

## Users

Two, and only two:

- **Jesse** — software developer, builds the system, uses the phone PWA for editing. Comfortable with technology, but does not want to be the only one editing.
- **Dorys** — native Spanish speaker, primary meal planner. Will use the fridge tablet daily. Comfortable with phones and tablets. **Will abandon the product if it adds friction over the whiteboard.**

There is no third user. There is no "family share" feature in scope. There is no admin panel.

## Surfaces

- **Fridge tablet** (primary) — always-on 10" Android tablet mounted on the fridge, running the PWA in kiosk mode (Fully Kiosk Browser). Touch + stylus input. This is the surface Dorys uses.
- **Phone PWAs** (secondary) — both partners' phones, used for edits while shopping or away from home.
- **Laptop** (tertiary) — administrative; setup, bulk edits, troubleshooting.

## Core interaction

The whiteboard has a 3×7 grid: Breakfast/Lunch/Dinner × Mon-Sun. Reproduce this exactly. Do not invent new layouts, accordion views, or "smart" defaults that hide the grid.

Cells are short freeform text — "egg bites", "Fish + green beans", "leftover / sandwich". Not structured recipes. Not normalized food items. Just text. The app's value comes from sync and persistence, not from imposing structure on what Dorys writes.

Some cells are intentionally blank. That is not missing data — it is **planned ambiguity**. Do not nag users to fill blank cells. Do not show "incomplete plan" warnings.

## Non-goals (worth restating)

- Not a calorie counter
- Not a recipe app
- Not a grocery delivery integration
- Not a social product
- Not a SaaS for other families

The owner has explicitly said: if scope creeps in any of these directions, the project will fail by becoming the wrong product.

## Constraints

- **Privacy**: this is family food data. No analytics, no telemetry, no third-party tracking, no error reporting SaaS without an approved spec. Logs stay on the server.
- **Spanish-readiness**: even though v1 ships English-only, all UI strings must be wrappable for i18n. Hardcoded English in JSX = needs to be refactored.
- **Offline tolerance**: the fridge tablet must keep showing the last-known plan even if wifi drops. Service worker caches `/api/plan`.
- **Touch-first**: every interactive element must work cleanly with a finger or stylus. Hover-only affordances are bugs.

## Vocabulary

Use this terminology consistently in code, specs, UI strings, and commit messages:

| Term | Meaning |
|---|---|
| **Plan** | The current week's grid of meals |
| **Slot** | A single cell — one (day, meal-type) intersection |
| **Meal type** | Breakfast, Lunch, or Dinner |
| **State** | `planned` / `fasting` / `skipped` / `eaten` |
| **Person** | `jesse`, `dorys`, or `null` (both) |
| **Whiteboard mode** | The handwriting-canvas overlay (Phase 2) |
| **Fridge tablet** | The kiosk-mode Android device |

Don't introduce synonyms ("meal entry", "slot item", "meal record"). Pick one term, use it everywhere.

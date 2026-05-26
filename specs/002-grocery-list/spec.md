# Spec: 002 — Grocery List

**Status**: draft
**Created**: 2026-05-11
**Owner**: Jesse
**Branch**: `feat/002-grocery-list`

---

## Problem

After Dorys and Jesse plan their meals for the week, they have to manually read the plan and write down what they need to buy at the grocery store. This manual extraction is tedious and prone to missing ingredients (e.g., forgetting to buy chicken for the "Chicken salad" planned for Friday).

## Users affected

- Jesse and Dorys
- Surface: Primarily phone (at the grocery store), secondarily fridge tablet (during planning)
- Frequency: Once a week for heavy shopping, occasionally for mid-week runs

## Acceptance criteria

- **View Access**: When a user taps a "Groceries" toggle or tab, then the view switches from the Plan Grid to the Grocery List.
- **Auto-Extraction**: Given a meal cell contains text (e.g., "Chicken Salad"), when the Grocery List is viewed, then the app automatically extracts ingredients (e.g., "Chicken") and suggests them. 
- **Categorization**: All items in the grocery list are automatically grouped by category (Produce, Protein, Dairy, Pantry, Other).
- **Manual Items**: When a user types an item name into the "Add item" field and presses Enter, then the item is added to the list and auto-categorized if possible.
- **Toggling Status**: When a user taps an item in the list, then it toggles between "to buy" and "bought" (visual strikethrough).
- **Persistence**: Given an item is marked as "bought", when the page is reloaded, then it remains "bought".
- **Clear List**: When a user taps "Clear list", then all checked items are removed from the view.

## Out of scope

- **Store Mapping**: Identifying which store to buy items at.
- **Quantities**: Adding "2 lbs" or "1 pack" explicitly in separate fields.
- **Recipe Scraping**: Importing ingredients from URLs.

## Technical Design (v1)

### Smart Parsing
To maintain privacy and speed, we will use a dictionary-based approach in the backend:
- **Meal-to-Ingredient Map**: A static JSON mapping of common meal names (and their Spanish equivalents) to a list of base ingredients.
- **Keyword Extraction**: If a meal name isn't in the map, we will search for known ingredient keywords within the string (e.g., "Chicken with rice" -> "Chicken", "Rice").

### Categorization
Ingredients will be assigned to categories via an **Ingredient-to-Category Map**:
- `Produce`: Fruits, vegetables, herbs.
- `Protein`: Meads, eggs, tofu.
- `Dairy`: Milk, cheese, yogurt.
- `Pantry`: Grains, spices, canned goods, oil.
- `Other`: Anything else.

## Open questions

- **Q1**: Should the list be shared globally or per-device? (Resolved: Global/Shared via backend).
- **Q2**: Do we need to distinguish between items derived from the plan and manually added items? (Resolved: Yes, manual items will be editable/deletable, derived items are linked to the plan).

## Resolved

- **R1**: The list is global and shared across all devices via the backend.
- **R2**: Categories are hardcoded for v1 to Produce, Protein, Dairy, Pantry, and Other.
- **R3**: Smart parsing uses a local dictionary to avoid external API calls.

## Constitutional concerns

- **Principle 5 (Spanish)**: "Groceries", "Add item", "Clear list" must be i18n-wrappable.
- **Principle 7 (Optimistic UI)**: Toggling an item should be instant.

## Success metric

- Dorys uses the list on her phone while at the grocery store.
- The "Clear list" action is used at least once a week.

## Notes

- Backend will need a new `/api/groceries` endpoint and a `GroceryItem` model.

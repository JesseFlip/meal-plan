"""
FridgePlan API Tests

Run with: pytest -v
"""

import os
import pytest
from fastapi.testclient import TestClient

# Set test database URL before importing main
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from main import app


@pytest.fixture(name="client")
def client_fixture():
    """Create a test client with fresh database."""
    with TestClient(app) as client:
        yield client


# ========== Health Check ==========


def test_health_check(client):
    """Test health endpoint returns ok status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert "ts" in data


# ========== Meal Plan Endpoints ==========


def test_get_plan(client):
    """Test GET /api/plan returns 21 slots (7 days x 3 meals)."""
    response = client.get("/api/plan")
    assert response.status_code == 200
    slots = response.json()
    assert isinstance(slots, list)
    assert len(slots) == 21
    # Check structure of first slot
    assert "id" in slots[0]
    assert "day" in slots[0]
    assert "slot" in slots[0]
    assert "text" in slots[0]
    assert "state" in slots[0]


def test_update_slot(client):
    """Test PUT /api/plan/{id} updates a meal slot."""
    # Get first slot
    response = client.get("/api/plan")
    slots = response.json()
    slot_id = slots[0]["id"]

    # Update it
    update_payload = {"text": "Test Meal", "state": "planned"}
    response = client.put(f"/api/plan/{slot_id}", json=update_payload)
    assert response.status_code == 200
    updated = response.json()
    assert updated["text"] == "Test Meal"
    assert updated["state"] == "planned"

    # Verify it persisted
    response = client.get("/api/plan")
    slots = response.json()
    found = next(s for s in slots if s["id"] == slot_id)
    assert found["text"] == "Test Meal"


def test_update_nonexistent_slot(client):
    """Test updating a non-existent slot returns 404."""
    response = client.put("/api/plan/9999", json={"text": "Test"})
    assert response.status_code == 404


def test_reset_plan(client):
    """Test POST /api/reset restores seed data."""
    # Modify a slot
    response = client.get("/api/plan")
    slots = response.json()
    slot_id = slots[0]["id"]
    client.put(f"/api/plan/{slot_id}", json={"text": "Modified"})

    # Reset
    response = client.post("/api/reset")
    assert response.status_code == 200
    assert response.json()["ok"] is True

    # Verify seed data is restored
    response = client.get("/api/plan")
    slots = response.json()
    assert len(slots) == 21


# ========== Grocery List Endpoints ==========


def test_get_groceries_empty(client):
    """Test GET /api/groceries returns empty list initially."""
    response = client.get("/api/groceries")
    assert response.status_code == 200
    items = response.json()
    assert isinstance(items, list)


def test_add_grocery(client):
    """Test POST /api/groceries adds a new item."""
    response = client.post("/api/groceries", json={"name": "Chicken"})
    assert response.status_code == 200
    item = response.json()
    assert item["name"] == "Chicken"
    assert item["category"] == "Protein"
    assert item["bought"] is False
    assert item["is_derived"] is False


def test_add_grocery_without_name(client):
    """Test adding grocery without name returns 400."""
    response = client.post("/api/groceries", json={})
    assert response.status_code == 400


def test_toggle_grocery(client):
    """Test PATCH /api/groceries/{id} toggles bought status."""
    # Add item
    response = client.post("/api/groceries", json={"name": "Milk"})
    item_id = response.json()["id"]

    # Toggle to bought
    response = client.patch(f"/api/groceries/{item_id}", json={"bought": True})
    assert response.status_code == 200
    item = response.json()
    assert item["bought"] is True

    # Toggle back
    response = client.patch(f"/api/groceries/{item_id}", json={"bought": False})
    assert response.status_code == 200
    item = response.json()
    assert item["bought"] is False


def test_clear_bought_groceries(client):
    """Test POST /api/groceries/clear removes bought items."""
    # Add two items
    client.post("/api/groceries", json={"name": "Eggs"})
    response = client.post("/api/groceries", json={"name": "Bread"})
    bread_id = response.json()["id"]

    # Mark one as bought
    client.patch(f"/api/groceries/{bread_id}", json={"bought": True})

    # Clear bought items
    response = client.post("/api/groceries/clear")
    assert response.status_code == 200
    assert response.json()["deleted"] == 1

    # Verify only unbought remains
    response = client.get("/api/groceries")
    items = response.json()
    assert len(items) == 1
    assert items[0]["name"] == "Eggs"


def test_sync_groceries_from_plan(client):
    """Test POST /api/groceries/sync extracts ingredients from meal plan."""
    # Ensure we have seed data
    client.post("/api/reset")

    # Sync groceries
    response = client.post("/api/groceries/sync")
    assert response.status_code == 200
    result = response.json()
    assert result["ok"] is True
    assert result["added"] >= 0

    # Verify items were added
    response = client.get("/api/groceries")
    items = response.json()
    # Seed data includes meals with recognizable ingredients
    assert len(items) > 0


# ========== Smart Parsing Tests ==========


def test_ingredient_categorization():
    """Test that ingredients are categorized correctly."""
    from main import categorize_ingredient

    assert categorize_ingredient("chicken") == "Protein"
    assert categorize_ingredient("Chicken") == "Protein"
    assert categorize_ingredient("lettuce") == "Produce"
    assert categorize_ingredient("milk") == "Dairy"
    assert categorize_ingredient("rice") == "Pantry"
    assert categorize_ingredient("unknown_item") == "Other"


def test_spanish_ingredients():
    """Test Spanish ingredient recognition."""
    from main import categorize_ingredient

    assert categorize_ingredient("pollo") == "Protein"
    assert categorize_ingredient("lechuga") == "Produce"
    assert categorize_ingredient("leche") == "Dairy"
    assert categorize_ingredient("arroz") == "Pantry"


def test_extract_ingredients_from_meal():
    """Test meal-to-ingredients extraction."""
    from main import extract_ingredients_from_meal

    # Test exact match
    ingredients = extract_ingredients_from_meal("chicken salad")
    assert "chicken" in ingredients
    assert "lettuce" in ingredients

    # Test keyword extraction
    ingredients = extract_ingredients_from_meal("grilled chicken with rice")
    assert "chicken" in ingredients
    assert "rice" in ingredients

    # Test fasting
    ingredients = extract_ingredients_from_meal("Fasting")
    assert len(ingredients) == 0

    # Test empty
    ingredients = extract_ingredients_from_meal("")
    assert len(ingredients) == 0

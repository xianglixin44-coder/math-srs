"""API integration tests — covers all endpoint boundary conditions."""

import json
import sqlite3
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from server.database import with_db, DB_PATH
from server.main import app


class TestCardsAPI:
    """GET /api/cards endpoints."""

    def test_list_cards_returns_list(self, client, seed_card):
        resp = client.get("/api/cards")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert any(c["id"] == seed_card["id"] for c in data)

    def test_get_card_by_id(self, client, seed_card):
        resp = client.get(f"/api/cards/{seed_card['id']}")
        assert resp.status_code == 200
        assert resp.json()["id"] == seed_card["id"]
        assert resp.json()["title"] == seed_card["title"]

    def test_get_card_not_found(self, client):
        resp = client.get("/api/cards/ZZ-99")
        assert resp.status_code == 404
        assert resp.json()["detail"] == "Not Found"

    def test_disabled_card_not_listed(self, client, seed_card):
        with with_db() as conn:
            conn.execute("UPDATE cards SET enabled=0 WHERE id=?", (seed_card["id"],))
            conn.commit()
        resp = client.get("/api/cards")
        assert all(c["id"] != seed_card["id"] for c in resp.json())


class TestSRSReviewAPI:
    """POST /api/srs/review — scoring endpoints."""

    def test_review_correct(self, client, seed_card):
        resp = client.post("/api/srs/review", json={
            "card_id": seed_card["id"],
            "dimension": "formula",
            "score": 3
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["interval"] == 1
        assert data["ease_factor"] == 2.6
        assert data["dimensions_passed"] == ["formula"]
        assert data["all_dimensions_pass"] is True  # formula is the only dimension, passed

    def test_review_wrong(self, client, seed_card):
        resp = client.post("/api/srs/review", json={
            "card_id": seed_card["id"],
            "dimension": "trigger",
            "score": 0
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["interval"] == 1
        assert data["ease_factor"] == 2.3

    def test_review_invalid_dimension(self, client, seed_card):
        resp = client.post("/api/srs/review", json={
            "card_id": seed_card["id"],
            "dimension": "invalid_dim",
            "score": 3
        })
        assert resp.status_code == 400
        assert "Invalid dimension" in resp.json()["detail"]

    def test_review_nonexistent_card(self, client):
        resp = client.post("/api/srs/review", json={
            "card_id": "ZZ-99",
            "dimension": "formula",
            "score": 3
        })
        assert resp.status_code == 400
        assert "Card not found" in resp.json()["detail"]

    def test_review_invalid_score(self, client, seed_card):
        resp = client.post("/api/srs/review", json={
            "card_id": seed_card["id"],
            "dimension": "formula",
            "score": 2  # only 0 or 3 allowed
        })
        assert resp.status_code == 400

    def test_review_missing_fields(self, client):
        resp = client.post("/api/srs/review", json={})
        assert resp.status_code == 422  # Pydantic validation


class TestSRSNextAPI:
    """GET /api/srs/next — due cards filtering."""

    def test_new_card_in_due(self, client, seed_card):
        resp = client.get("/api/srs/next")
        data = resp.json()
        assert any(c["id"] == seed_card["id"] for c in data)

    def test_reviewed_card_not_due(self, client, seed_card):
        client.post("/api/srs/review", json={
            "card_id": seed_card["id"],
            "dimension": "formula",
            "score": 3
        })
        resp = client.get("/api/srs/next")
        data = resp.json()
        assert all(c["id"] != seed_card["id"] for c in data)


class TestImportAPI:
    """POST /api/import — card import."""

    def test_import_single_card(self, client):
        card = {
            "id": "IM-01",
            "title": "Imported Card",
            "dimensions": {"cloze": {"formula": {"question": "x=[[1]]", "answer": ["1"]}}}
        }
        resp = client.post("/api/import", json=card)
        assert resp.status_code == 200
        assert resp.json()["imported"] == 1

    def test_import_array(self, client):
        cards = [
            {"id": "IM-01", "title": "A", "dimensions": {}},
            {"id": "IM-02", "title": "B", "dimensions": {}}
        ]
        resp = client.post("/api/import", json=cards)
        assert resp.json()["imported"] == 2

    def test_import_replaces_existing(self, client, seed_card):
        """Re-importing same ID should overwrite and clear old SRS state."""
        # First, create SRS state for the card
        client.post("/api/srs/review", json={
            "card_id": seed_card["id"],
            "dimension": "formula",
            "score": 3
        })
        # Re-import with new title
        updated = {**seed_card, "title": "Updated Title"}
        resp = client.post("/api/import", json=updated)
        assert resp.status_code == 200
        assert resp.json()["imported"] == 1
        # Verify card title updated
        r = client.get(f"/api/cards/{seed_card['id']}")
        assert r.json()["title"] == "Updated Title"
        # Verify SRS state cleared
        r = client.get("/api/srs/state")
        assert all(s["card_id"] != seed_card["id"] for s in r.json())

    def test_import_missing_required_fields(self, client):
        resp = client.post("/api/import", json=[{"id": "X"}])  # missing title + dimensions
        assert resp.status_code == 400


class TestExportAPI:
    """GET /api/export/* — data export."""

    def test_export_cards(self, client, seed_card):
        resp = client.get("/api/export/cards")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert any(c["id"] == seed_card["id"] for c in data)

    def test_export_stats_csv(self, client, seed_card):
        # Create a review log entry
        client.post("/api/srs/review", json={
            "card_id": seed_card["id"],
            "dimension": "formula",
            "score": 3
        })
        resp = client.get("/api/export/stats")
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "text/csv; charset=utf-8" or "text/csv" in resp.headers["content-type"]
        body = resp.text
        assert "卡片ID" in body  # CSV header
        assert seed_card["id"] in body

    def test_export_backup_zip(self, client, seed_card):
        resp = client.get("/api/export/backup")
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "application/zip"
        assert len(resp.content) > 0  # non-empty zip


class TestBrowseAPI:
    """GET /api/browse/* — browse card endpoints."""

    def test_browse_cards_list(self, client):
        resp = client.get("/api/browse/cards")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

    def test_browse_card_not_found(self, client):
        resp = client.get("/api/browse/cards/nonexistent")
        assert resp.status_code == 404


class TestSRSStateAPI:
    """GET /api/srs/state."""

    def test_srs_state_returns_list(self, client, seed_card):
        client.post("/api/srs/review", json={
            "card_id": seed_card["id"],
            "dimension": "formula",
            "score": 3
        })
        resp = client.get("/api/srs/state")
        assert resp.status_code == 200
        data = resp.json()
        assert any(s["card_id"] == seed_card["id"] for s in data)

    def test_srs_state_empty_when_no_reviews(self, client):
        resp = client.get("/api/srs/state")
        assert resp.json() == []


class TestSPAFallback:
    """404 handler returns index.html for non-API paths."""

    def test_spa_fallback_returns_html(self, client):
        resp = client.get("/some/random/path", headers={"Accept": "text/html"})
        # The SPA fallback returns index.html if it exists
        assert resp.status_code in (200, 404)
        if resp.status_code == 200:
            assert '<div id="root"></div>' in resp.text

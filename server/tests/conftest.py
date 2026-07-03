"""Shared fixtures for backend tests."""

import json
import os
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Override DB_PATH before importing server modules
import server.database as db
_tmp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
db.DB_PATH = Path(_tmp_db.name)
db.DB_DIR = db.DB_PATH.parent

from server.main import app


@pytest.fixture(autouse=True)
def _test_db():
    """Re-initialize a clean in-memory database before each test."""
    # Override get_db to use a fresh in-memory DB
    original_get_db = db.get_db

    def test_get_db():
        conn = original_get_db()
        conn.execute("PRAGMA journal_mode=MEMORY")
        return conn

    db.get_db = test_get_db
    db.init_db()
    yield
    # Clean up after test
    try:
        os.unlink(str(db.DB_PATH))
        os.unlink(str(db.DB_PATH) + "-shm")
        os.unlink(str(db.DB_PATH) + "-wal")
    except OSError:
        pass
    db.get_db = original_get_db


@pytest.fixture
def client():
    """FastAPI TestClient."""
    return TestClient(app)


@pytest.fixture
def sample_card():
    """A minimal card dict for seeding tests."""
    return {
        "id": "99-99",
        "title": "Test Card",
        "category": "Test",
        "motifIds": [],
        "dimensions": {
            "cloze": {
                "formula": {"question": "x = [[1]]", "answer": ["1"]}
            },
            "choice": {
                "trigger": {"question": "pick x?", "options": ["1", "2", "3", "4"], "answer": 0}
            }
        }
    }


@pytest.fixture
def seed_card(sample_card):
    """Insert sample_card into the database and return it."""
    with db.with_db() as conn:
        conn.execute(
            "INSERT INTO cards VALUES (?,?,?,?,?,?,?)",
            (sample_card["id"], sample_card["title"], sample_card["category"],
             json.dumps(sample_card["motifIds"], ensure_ascii=False),
             json.dumps(sample_card["dimensions"], ensure_ascii=False),
             "test", 1)
        )
        conn.commit()
    return sample_card

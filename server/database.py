import sqlite3
import json
from contextlib import contextmanager
from pathlib import Path
from datetime import datetime, timedelta

DB_DIR = Path("data")
DB_DIR.mkdir(exist_ok=True)
DB_PATH = DB_DIR / "cards.db"


def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


@contextmanager
def with_db():
    """Context manager for safe DB connections — always closes on exit."""
    conn = get_db()
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    with with_db() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS cards (
            id          TEXT PRIMARY KEY,
            title       TEXT NOT NULL,
            category    TEXT,
            motif_ids   TEXT DEFAULT '[]',
            dimensions  TEXT NOT NULL,
            source      TEXT DEFAULT 'builtin',
            enabled     INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS srs_state (
            card_id      TEXT PRIMARY KEY,
            ease_factor  REAL DEFAULT 2.5,
            interval     INTEGER DEFAULT 1,
            due_date     TEXT,
            reps         INTEGER DEFAULT 0,
            last_review  TEXT
        );

        CREATE TABLE IF NOT EXISTS review_log (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            card_id    TEXT NOT NULL,
            dimension  TEXT NOT NULL,
            score      INTEGER NOT NULL,
            timestamp  TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS feynman_responses (
            card_id    TEXT PRIMARY KEY,
            answer     TEXT DEFAULT '',
            rating     INTEGER,
            saved_at   TEXT DEFAULT (datetime('now'))
        );
    """)
        conn.commit()

        # Seed from cards.json if cards table is empty
        count = conn.execute("SELECT COUNT(*) FROM cards").fetchone()[0]
        if count == 0:
            seed_file = Path(__file__).parent.parent / "public" / "data" / "cards.json"
            if seed_file.exists():
                cards = json.loads(seed_file.read_text())
                if isinstance(cards, dict):
                    cards = [cards]
                if isinstance(cards, list):
                    for c in cards:
                        conn.execute(
                            "INSERT OR IGNORE INTO cards VALUES (?,?,?,?,?,?,?)",
                            (c["id"], c["title"], c.get("category"),
                             json.dumps(c.get("motifIds", []), ensure_ascii=False),
                             json.dumps(c["dimensions"], ensure_ascii=False),
                             "builtin", 1)
                        )
                    conn.commit()


# ─── SM-2 Algorithm ───────────────────────────────────────────────

def sm2_update(card_id: str, score: int):
    with with_db() as conn:
        # Check card exists
        card = conn.execute("SELECT id FROM cards WHERE id=?", (card_id,)).fetchone()
        if not card:
            raise ValueError(f"Card not found: {card_id}")
        if score not in (0, 3):
            raise ValueError(f"Score must be 0 or 3, got {score}")
        row = conn.execute("SELECT * FROM srs_state WHERE card_id=?", (card_id,)).fetchone()

        now = datetime.now()
        if row is None:
            ef, interval, reps = 2.5, 1, 0
        else:
            ef, interval, reps = row["ease_factor"], row["interval"], row["reps"]

        if score >= 3:
            if reps == 0:
                interval = 1
            elif reps == 1:
                interval = 6
            else:
                interval = max(1, int(interval * ef + 0.5))
            reps += 1
            ef = max(1.3, ef + 0.1)
        else:
            reps = 0
            interval = 1
            ef = max(1.3, ef - 0.2)
        due_date = (now + timedelta(days=interval)).isoformat()

        conn.execute("""
            INSERT INTO srs_state (card_id, ease_factor, interval, due_date, reps, last_review)
            VALUES (?,?,?,?,?,?)
            ON CONFLICT(card_id) DO UPDATE SET
                ease_factor=excluded.ease_factor, interval=excluded.interval,
                due_date=excluded.due_date, reps=excluded.reps, last_review=excluded.last_review
        """, (card_id, ef, interval, due_date, reps, now.isoformat()))

        conn.commit()
    return {"ease_factor": ef, "interval": interval, "due_date": due_date, "reps": reps}


def get_due_cards():
    with with_db() as conn:
        now = datetime.now().isoformat()
        rows = conn.execute(
            "SELECT c.id, c.title, c.category, c.dimensions, "
            "s.ease_factor, s.interval, s.due_date, s.reps "
            "FROM cards c LEFT JOIN srs_state s ON c.id = s.card_id "
            "WHERE c.enabled=1 AND (s.due_date <= ? OR s.card_id IS NULL)",
            (now,)
        ).fetchall()

        cards = []
        for r in rows:
            c = {"id": r["id"], "title": r["title"], "category": r["category"],
                 "dimensions": json.loads(r["dimensions"])}
            if r["ease_factor"] is not None:
                c["srs"] = {"ease_factor": r["ease_factor"], "interval": r["interval"],
                            "due_date": r["due_date"], "reps": r["reps"]}
            else:
                c["srs"] = None
            cards.append(c)

    return cards

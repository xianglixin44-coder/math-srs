import json
from fastapi import APIRouter, HTTPException
from server.database import with_db

router = APIRouter(prefix="/api/cards", tags=["cards"])


@router.get("")
def list_cards():
    with with_db() as conn:
        rows = conn.execute("SELECT * FROM cards WHERE enabled=1").fetchall()
    return [{
        "id": r["id"], "title": r["title"], "category": r["category"],
        "motifIds": json.loads(r["motif_ids"]),
        "dimensions": json.loads(r["dimensions"])
    } for r in rows]


@router.get("/{card_id}")
def get_card(card_id: str):
    with with_db() as conn:
        r = conn.execute("SELECT * FROM cards WHERE id=?", (card_id,)).fetchone()
    if not r:
        raise HTTPException(404, "Card not found")
    return {
        "id": r["id"], "title": r["title"], "category": r["category"],
        "motifIds": json.loads(r["motif_ids"]),
        "dimensions": json.loads(r["dimensions"])
    }

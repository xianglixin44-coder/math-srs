from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from server.database import with_db

router = APIRouter(prefix="/api/feynman", tags=["feynman"])


class FeynmanSave(BaseModel):
    card_id: str
    answer: str = ""
    rating: Optional[int] = Field(default=None, ge=0, le=3)


@router.get("/{card_id}")
def get_feynman(card_id: str):
    with with_db() as conn:
        row = conn.execute(
            "SELECT answer, rating, saved_at FROM feynman_responses WHERE card_id=?",
            (card_id,)
        ).fetchone()
    if not row:
        return {"card_id": card_id, "answer": "", "rating": None, "saved_at": None}
    return {"card_id": card_id, "answer": row["answer"], "rating": row["rating"], "saved_at": row["saved_at"]}


@router.post("/save")
def save_feynman(req: FeynmanSave):
    with with_db() as conn:
        conn.execute(
            """INSERT INTO feynman_responses (card_id, answer, rating, saved_at)
               VALUES (?,?,?,datetime('now'))
               ON CONFLICT(card_id) DO UPDATE SET
               answer=excluded.answer, rating=excluded.rating, saved_at=datetime('now')""",
            (req.card_id, req.answer, req.rating)
        )
        conn.commit()
    return {"ok": True, "card_id": req.card_id}

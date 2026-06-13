import json
from fastapi import APIRouter, HTTPException
from server.database import with_db, sm2_update, get_due_cards
from server.models import ReviewRequest

router = APIRouter(prefix="/api/srs", tags=["srs"])


@router.get("/state")
def get_state():
    with with_db() as conn:
        rows = conn.execute("SELECT * FROM srs_state").fetchall()
    return [dict(r) for r in rows]


@router.get("/next")
def next_cards():
    return get_due_cards()


VALID_DIMENSIONS = {'formula', 'derive', 'trigger', 'geometry', 'trap', 'challenge', 'transform'}

@router.post("/review")
def review(req: ReviewRequest):
    if req.dimension not in VALID_DIMENSIONS:
        raise HTTPException(400, f"Invalid dimension: {req.dimension}")
    try:
        result = sm2_update(req.card_id, req.score)
    except ValueError as e:
        raise HTTPException(400, str(e))

    # Log
    with with_db() as conn:
        conn.execute(
            "INSERT INTO review_log (card_id, dimension, score) VALUES (?,?,?)",
            (req.card_id, req.dimension, req.score))
        conn.commit()

        # Count dimension scores for this card
        scores = conn.execute(
            "SELECT dimension, score FROM review_log WHERE card_id=? ORDER BY id DESC",
            (req.card_id,)
        ).fetchall()

        # Get latest score per dimension
        dim_scores = {}
        for s in scores:
            if s["dimension"] not in dim_scores:
                dim_scores[s["dimension"]] = s["score"]

        all_pass = all(v == 3 for v in dim_scores.values())
        card_dims = set(dim_scores.keys())

    return {**result, "dimensions_passed": sorted(card_dims), "all_dimensions_pass": all_pass}

import json
import io
import zipfile
import csv
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from server.database import with_db

router = APIRouter(prefix="/api", tags=["import-export"])


@router.post("/import")
async def import_cards(req: Request):
    body = await req.json()
    data = body if isinstance(body, list) else [body]

    with with_db() as conn:
        count = 0
        for c in data:
            if "id" not in c or "title" not in c or "dimensions" not in c:
                raise HTTPException(400, "Each card must have id, title, and dimensions")
            conn.execute(
                "INSERT OR REPLACE INTO cards VALUES (?,?,?,?,?,?,?)",
                (c["id"], c["title"], c.get("category"),
                 json.dumps(c.get("motifIds", []), ensure_ascii=False),
                 json.dumps(c["dimensions"], ensure_ascii=False),
                 "imported", 1)
            )
            count += 1
        conn.commit()
    return {"imported": count}


@router.get("/export/cards")
def export_cards():
    with with_db() as conn:
        rows = conn.execute("SELECT * FROM cards WHERE enabled=1").fetchall()
    cards = [{
        "id": r["id"], "title": r["title"], "category": r["category"],
        "motifIds": json.loads(r["motif_ids"]),
        "dimensions": json.loads(r["dimensions"])
    } for r in rows]
    return cards


@router.get("/export/progress")
def export_progress():
    with with_db() as conn:
        state = [dict(r) for r in conn.execute("SELECT * FROM srs_state").fetchall()]
        log = [dict(r) for r in conn.execute("SELECT * FROM review_log").fetchall()]
    return {"srs_state": state, "review_log": log}


@router.get("/export/stats")
def export_stats():
    with with_db() as conn:
        rows = conn.execute("""
            SELECT date(timestamp) as day, card_id, dimension, score
            FROM review_log ORDER BY timestamp DESC
        """).fetchall()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["日期", "卡片ID", "维度", "评分"])
    for r in rows:
        writer.writerow([r["day"], r["card_id"], r["dimension"], r["score"]])

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=srs_stats.csv"}
    )


@router.get("/export/backup")
def export_backup():
    with with_db() as conn:
        cards = [dict(r) for r in conn.execute("SELECT * FROM cards").fetchall()]
        state = [dict(r) for r in conn.execute("SELECT * FROM srs_state").fetchall()]

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("cards.json", json.dumps(cards, ensure_ascii=False, indent=2))
        zf.writestr("srs_state.json", json.dumps(state, ensure_ascii=False, indent=2))
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=srs_backup.zip"}
    )

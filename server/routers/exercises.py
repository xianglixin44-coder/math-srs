import json
from pathlib import Path
from fastapi import APIRouter

router = APIRouter(prefix="/api/exercises", tags=["exercises"])
LECTURES_DIR = Path(__file__).parent.parent.parent / "public" / "data" / "lectures"

@router.get("")
def list_exercises():
    items = []
    for f in sorted(LECTURES_DIR.glob("*.json")):
        d = json.loads(f.read_text())
        for part in d.get("parts", []):
            for sec in part.get("sections", []):
                if sec.get("key") == "exercises" and sec.get("content", "").strip():
                    items.append({
                        "lectureId": d["id"],
                        "lectureTitle": d["title"],
                        "content": sec["content"],
                    })
    return items

@router.get("/{lecture_id}")
def get_exercise(lecture_id: str):
    f = LECTURES_DIR / f"{lecture_id}.json"
    if not f.exists():
        return {"content": ""}
    d = json.loads(f.read_text())
    for part in d.get("parts", []):
        for sec in part.get("sections", []):
            if sec.get("key") == "exercises":
                return {"lectureId": d["id"], "lectureTitle": d["title"], "content": sec["content"]}
    return {"content": ""}

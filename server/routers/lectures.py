import json
from pathlib import Path
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/lectures", tags=["lectures"])

LECTURES_DIR = Path(__file__).parent.parent.parent / "public" / "data" / "lectures"


@router.get("")
def list_lectures():
    """List all available lectures (summary only)."""
    lectures = []
    if LECTURES_DIR.exists():
        for f in sorted(LECTURES_DIR.glob("*.json")):
            try:
                data = json.loads(f.read_text())
                lectures.append({
                    "id": data["id"],
                    "title": data["title"],
                    "textbook": data.get("textbook", ""),
                    "partCount": len(data.get("parts", [])),
                })
            except (json.JSONDecodeError, KeyError):
                continue
    return lectures


@router.get("/{lecture_id}")
def get_lecture(lecture_id: str):
    """Get full lecture with all sections."""
    file_path = LECTURES_DIR / f"{lecture_id}.json"
    if not file_path.exists():
        raise HTTPException(404, "Lecture not found")
    return json.loads(file_path.read_text())

import json
from pathlib import Path
from fastapi import APIRouter

router = APIRouter(prefix="/api/browse", tags=["browse"])

BROWSE_DIR = Path(__file__).parent.parent.parent / "public" / "data" / "browse"


@router.get("/cards")
def list_browse_cards():
    """List all browse cards (summary only, no section content)."""
    cards = []
    if BROWSE_DIR.exists():
        for f in sorted(BROWSE_DIR.glob("*.json")):
            try:
                data = json.loads(f.read_text())
                cards.append({
                    "id": data["id"],
                    "title": data["title"],
                    "category": data.get("category"),
                    "sectionCount": len(data.get("sections", [])),
                })
            except (json.JSONDecodeError, KeyError):
                continue
    return cards


@router.get("/cards/{card_id}")
def get_browse_card(card_id: str):
    """Get full browse card with all sections."""
    file_path = BROWSE_DIR / f"{card_id}.json"
    if not file_path.exists():
        from fastapi import HTTPException
        raise HTTPException(404, "Browse card not found")
    return json.loads(file_path.read_text())

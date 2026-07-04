import json
from pathlib import Path
from fastapi import APIRouter

router = APIRouter(prefix="/api/browse", tags=["browse"])

BROWSE_DIR = Path(__file__).parent.parent.parent / "public" / "data" / "browse"


TEXTBOOK_FILE = Path(__file__).parent.parent.parent / "public" / "data" / "browse" / "textbook.json"


@router.get("/textbook")
def get_textbook():
    """Load textbook table of contents."""
    if not TEXTBOOK_FILE.exists():
        from fastapi import HTTPException
        raise HTTPException(404, "Textbook not found")
    return json.loads(TEXTBOOK_FILE.read_text())


@router.get("/cards")
def list_browse_cards():
    """List all browse cards (summary only, no section content)."""
    cards = []
    if BROWSE_DIR.exists():
        for f in sorted(BROWSE_DIR.glob("*.json")):
            try:
                data = json.loads(f.read_text())
                # Check if challenge section has 3-layer scaffold
                has_scaffold = False
                for s in data.get("sections", []):
                    if s.get("key") == "challenge" and "思维脚手架" in s.get("content", ""):
                        has_scaffold = True
                        break
                cards.append({
                    "id": data["id"],
                    "title": data["title"],
                    "category": data.get("category"),
                    "sectionCount": len(data.get("sections", [])),
                    "hasScaffold": has_scaffold,
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

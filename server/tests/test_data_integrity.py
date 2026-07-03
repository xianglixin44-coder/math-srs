"""Data integrity tests — validates consistency between textbook, browse, and card data files."""

import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

BROWSE_DIR = PROJECT_ROOT / "public" / "data" / "browse"
CARDS_FILE = PROJECT_ROOT / "public" / "data" / "cards.json"
TEXTBOOK_FILE = BROWSE_DIR / "textbook.json"


class TestTextbookConsistency:
    """All sections in textbook.json must have corresponding browse/*.json files."""

    def _get_all_section_ids(self):
        tb = json.loads(TEXTBOOK_FILE.read_text())
        ids = []
        for vol in tb.get("volumes", []):
            for ch in vol.get("chapters", []):
                for sec in ch.get("sections", []):
                    ids.append(sec["id"])
        return ids

    def test_all_textbook_sections_have_browse_file(self):
        if not TEXTBOOK_FILE.exists():
            pytest.skip("textbook.json not found")
        section_ids = self._get_all_section_ids()
        for sid in section_ids:
            browse_file = BROWSE_DIR / f"{sid}.json"
            assert browse_file.exists(), f"Missing browse file: {sid}.json"

    def test_each_browse_file_registered_in_textbook(self):
        if not TEXTBOOK_FILE.exists():
            pytest.skip("textbook.json not found")
        section_ids = set(self._get_all_section_ids())
        for f in BROWSE_DIR.glob("*.json"):
            if f.name == "textbook.json":
                continue
            data = json.loads(f.read_text())
            assert data["id"] in section_ids, (
                f"Browse file {f.name} has id={data['id']} not in textbook.json"
            )

    def test_browse_section_count_matches(self):
        if not TEXTBOOK_FILE.exists():
            pytest.skip("textbook.json not found")
        section_ids = self._get_all_section_ids()
        file_ids = []
        for f in BROWSE_DIR.glob("*.json"):
            if f.name == "textbook.json":
                continue
            data = json.loads(f.read_text())
            file_ids.append(data["id"])
        assert len(file_ids) == len(section_ids), (
            f"Browse files count ({len(file_ids)}) != textbook sections ({len(section_ids)})"
        )


class TestBrowseCardStructure:
    """Each browse/*.json must have the correct structure."""

    def test_each_browse_has_required_fields(self):
        if not BROWSE_DIR.exists():
            pytest.skip("browse dir not found")
        for f in sorted(BROWSE_DIR.glob("*.json")):
            if f.name == "textbook.json":
                continue
            data = json.loads(f.read_text())
            assert "id" in data, f"{f.name} missing 'id'"
            assert "title" in data, f"{f.name} missing 'title'"
            assert "sections" in data, f"{f.name} missing 'sections'"
            assert isinstance(data["sections"], list), f"{f.name} sections not a list"
            for sec in data["sections"]:
                assert "key" in sec, f"{f.name} section missing 'key'"
                assert "label" in sec, f"{f.name} section missing 'label'"
                assert "content" in sec, f"{f.name} section missing 'content'"

    def test_browse_section_count_accurate(self):
        if not BROWSE_DIR.exists():
            pytest.skip("browse dir not found")
        for f in sorted(BROWSE_DIR.glob("*.json")):
            if f.name == "textbook.json":
                continue
            data = json.loads(f.read_text())
            assert len(data.get("sections", [])) == len(data["sections"])


class TestCardDataStructure:
    """cards.json must follow Scheme B format."""

    def test_all_cards_have_required_fields(self):
        if not CARDS_FILE.exists():
            pytest.skip("cards.json not found")
        cards = json.loads(CARDS_FILE.read_text())
        assert isinstance(cards, list), "cards.json must be an array"
        assert len(cards) > 0, "cards.json is empty"
        for card in cards:
            assert "id" in card, f"Card missing 'id': {card.get('title', '?')}"
            assert "title" in card, f"Card {card.get('id', '?')} missing 'title'"
            assert "dimensions" in card, f"Card {card.get('id', '?')} missing 'dimensions'"
            dims = card["dimensions"]
            assert isinstance(dims, dict), f"Card {card['id']} dimensions not an object"
            # At least one of cloze or choice should exist
            assert "cloze" in dims or "choice" in dims, (
                f"Card {card['id']} has no cloze or choice dimensions"
            )

    def test_card_ids_in_textbook(self):
        if not TEXTBOOK_FILE.exists() or not CARDS_FILE.exists():
            pytest.skip("Required files not found")
        tb = json.loads(TEXTBOOK_FILE.read_text())
        all_ids = set()
        for vol in tb.get("volumes", []):
            for ch in vol.get("chapters", []):
                for sec in ch.get("sections", []):
                    all_ids.add(sec["id"])
        cards = json.loads(CARDS_FILE.read_text())
        for card in cards:
            assert card["id"] in all_ids, (
                f"Card {card['id']} ({card['title']}) not found in textbook.json"
            )
